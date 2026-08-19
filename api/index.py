from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import hashlib
import secrets
import base64
import hmac
import time
import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_e5SG0OLkNUQz@ep-rough-lake-ayu4belb.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_jpw_services_2026_secure")

def get_db():
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    conn.autocommit = True
    return conn

def init_db():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                user_id INT DEFAULT 1,
                title TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS bookmarks (
                id SERIAL PRIMARY KEY,
                user_id INT DEFAULT 1,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                category TEXT DEFAULT 'General & IT',
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS hr_contacts (
                id SERIAL PRIMARY KEY,
                user_id INT DEFAULT 1,
                hr_name TEXT NOT NULL,
                company_name TEXT NOT NULL,
                hr_number TEXT DEFAULT '',
                email_id TEXT DEFAULT '',
                location TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                user_id INT DEFAULT 1,
                title TEXT NOT NULL,
                project_title TEXT,
                live_url TEXT NOT NULL,
                github_url TEXT DEFAULT '',
                status TEXT DEFAULT 'Live',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                user_id INT DEFAULT 1,
                title TEXT NOT NULL,
                subject TEXT DEFAULT '',
                category TEXT DEFAULT 'Assignment / Homework',
                deadline_date TEXT NOT NULL,
                date TEXT,
                status TEXT DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS exams (
                id SERIAL PRIMARY KEY,
                user_id INT DEFAULT 1,
                title TEXT NOT NULL,
                exam_name TEXT,
                exact_date TEXT NOT NULL,
                date TEXT,
                status TEXT DEFAULT 'Upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.close()
    except Exception as e:
        print(f"Neon Init Error: {e}")

init_db()

def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', str(password).encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"{salt}${pwd_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not hashed_password or "$" not in hashed_password:
            return plain_password == hashed_password
        salt, stored_hash = hashed_password.split("$", 1)
        calc_hash = hashlib.pbkdf2_hmac('sha256', str(plain_password).encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return secrets.compare_digest(stored_hash, calc_hash)
    except Exception:
        return plain_password == hashed_password

def b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def create_access_token(data: dict) -> str:
    header = {"alg": "HS256", "typ": "jwt"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + (30 * 24 * 60 * 60)
    h_b64 = b64_encode(json.dumps(header).encode('utf-8'))
    p_b64 = b64_encode(json.dumps(payload).encode('utf-8'))
    sig = hmac.new(SECRET_KEY.encode('utf-8'), f"{h_b64}.{p_b64}".encode('utf-8'), hashlib.sha256).digest()
    return f"{h_b64}.{p_b64}.{b64_encode(sig)}"

class handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: any):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        init_db()
        path = self.path.split("?")[0].lower().rstrip("/")

        if path.endswith("/me") or "/auth/me" in path:
            return self._send_json(200, {"id": 1, "full_name": "Rohan Singh", "email": "rohan8688832@gmail.com"})

        elif "quote" in path or "daily-focus" in path:
            return self._send_json(200, {"quote": "Focus is a muscle. The more you practice it, the stronger it becomes.", "author": "JPW Services"})

        try:
            conn = get_db()
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            if "todo" in path or "task" in path:
                cursor.execute("SELECT * FROM todos ORDER BY id DESC")
                return self._send_json(200, cursor.fetchall())

            elif "bookmark" in path or "portal" in path:
                cursor.execute("SELECT * FROM bookmarks ORDER BY id DESC")
                return self._send_json(200, cursor.fetchall())

            elif "hr" in path:
                cursor.execute("SELECT * FROM hr_contacts ORDER BY id DESC")
                return self._send_json(200, cursor.fetchall())

            elif "project" in path:
                cursor.execute("SELECT * FROM projects ORDER BY id DESC")
                rows = cursor.fetchall()
                for r in rows:
                    val = r.get("title") or r.get("project_title") or "Project"
                    r["title"] = val
                    r["project_title"] = val
                    r["name"] = val
                return self._send_json(200, rows)

            elif "assignment" in path or "deadline" in path:
                cursor.execute("SELECT * FROM assignments ORDER BY id DESC")
                rows = cursor.fetchall()
                for r in rows:
                    val = r.get("deadline_date") or r.get("date") or "2026-09-01"
                    r["deadline_date"] = val
                    r["date"] = val
                return self._send_json(200, rows)

            elif "exam" in path:
                cursor.execute("SELECT * FROM exams ORDER BY id DESC")
                rows = cursor.fetchall()
                for r in rows:
                    val = r.get("exact_date") or r.get("date") or "2026-09-01"
                    r["exact_date"] = val
                    r["date"] = val
                return self._send_json(200, rows)

            elif any(k in path for k in ["stats", "summary", "count", "overview"]):
                cursor.execute("SELECT COUNT(*) as count FROM bookmarks")
                b_cnt = cursor.fetchone()['count']
                cursor.execute("SELECT COUNT(*) as count FROM projects")
                p_cnt = cursor.fetchone()['count']
                cursor.execute("SELECT COUNT(*) as count FROM hr_contacts")
                h_cnt = cursor.fetchone()['count']
                return self._send_json(200, {"saved_links": b_cnt, "active_projects": p_cnt, "hr_contacts": h_cnt})

            else:
                return self._send_json(200, [])

        except Exception as e:
            return self._send_json(500, {"error": str(e)})
        finally:
            if 'conn' in locals() and conn:
                conn.close()

    def do_POST(self):
        init_db()
        path = self.path.split("?")[0].lower().rstrip("/")
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = {}

        try:
            conn = get_db()
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            if "register" in path:
                full_name = body.get("full_name", "").strip() or "User"
                email = body.get("email", "").lower().strip()
                password = str(body.get("password", ""))

                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cursor.fetchone():
                    return self._send_json(400, {"detail": "Account already exists."})

                hashed_pwd = get_password_hash(password)
                cursor.execute("INSERT INTO users (full_name, email, hashed_password) VALUES (%s, %s, %s) RETURNING id", (full_name, email, hashed_pwd))
                user_id = cursor.fetchone()['id']
                token = create_access_token({"sub": str(user_id), "email": email})
                return self._send_json(201, {"access_token": token, "token": token, "user": {"id": user_id, "full_name": full_name, "email": email}})

            elif "login" in path:
                email = body.get("email", "").lower().strip()
                password = str(body.get("password", ""))

                cursor.execute("SELECT id, full_name, hashed_password FROM users WHERE email = %s", (email,))
                user = cursor.fetchone()

                if user:
                    user_id, full_name, hashed_pwd = user['id'], user['full_name'], user['hashed_password']
                    if verify_password(password, hashed_pwd):
                        token = create_access_token({"sub": str(user_id), "email": email})
                        return self._send_json(200, {"access_token": token, "token": token, "user": {"id": user_id, "full_name": full_name, "email": email}})
                    else:
                        return self._send_json(401, {"detail": "Invalid credentials"})
                else:
                    hashed_pwd = get_password_hash(password)
                    full_name = email.split("@")[0].capitalize()
                    cursor.execute("INSERT INTO users (full_name, email, hashed_password) VALUES (%s, %s, %s) RETURNING id", (full_name, email, hashed_pwd))
                    user_id = cursor.fetchone()['id']
                    token = create_access_token({"sub": str(user_id), "email": email})
                    return self._send_json(200, {"access_token": token, "token": token, "user": {"id": user_id, "full_name": full_name, "email": email}})

            elif "todo" in path or "task" in path:
                title = body.get("title") or body.get("task") or "New Task"
                cursor.execute("INSERT INTO todos (title, completed, status) VALUES (%s, FALSE, 'pending') RETURNING id", (title,))
                item_id = cursor.fetchone()['id']
                return self._send_json(201, {"id": item_id, "title": title, "completed": False, "status": "pending"})

            elif "bookmark" in path or "portal" in path:
                title = body.get("title") or body.get("name") or "Portal"
                url = body.get("url") or body.get("link") or "#"
                category = body.get("category") or "General & IT"
                description = body.get("description") or "Custom portal"
                cursor.execute("INSERT INTO bookmarks (title, url, category, description) VALUES (%s, %s, %s, %s) RETURNING id", (title, url, category, description))
                item_id = cursor.fetchone()['id']
                return self._send_json(201, {"id": item_id, "title": title, "url": url, "category": category, "description": description})

            elif "hr" in path:
                hr_name = body.get("hr_name") or body.get("name") or "HR Name"
                company_name = body.get("company_name") or body.get("company") or "Company"
                hr_number = body.get("hr_number") or body.get("phone") or ""
                email_id = body.get("email_id") or body.get("email") or ""
                location = body.get("location") or ""
                cursor.execute(
                    "INSERT INTO hr_contacts (hr_name, company_name, hr_number, email_id, location) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (hr_name, company_name, hr_number, email_id, location)
                )
                item_id = cursor.fetchone()['id']
                return self._send_json(201, {"id": item_id, "hr_name": hr_name, "company_name": company_name, "hr_number": hr_number, "email_id": email_id, "location": location})

            elif "project" in path:
                title = body.get("title") or body.get("project_title") or "Project"
                live_url = body.get("live_url") or body.get("url") or "#"
                github_url = body.get("github_url") or body.get("github") or ""
                cursor.execute(
                    "INSERT INTO projects (title, project_title, live_url, github_url, status) VALUES (%s, %s, %s, %s, 'Live') RETURNING id",
                    (title, title, live_url, github_url)
                )
                item_id = cursor.fetchone()['id']
                return self._send_json(201, {"id": item_id, "title": title, "project_title": title, "name": title, "live_url": live_url, "github_url": github_url, "status": "Live"})

            elif "assignment" in path or "deadline" in path:
                title = body.get("title") or body.get("assignment_title") or "Assignment"
                category = body.get("category") or "Assignment / Homework"
                subject = body.get("subject") or ""
                deadline_date = body.get("deadline_date") or body.get("date") or time.strftime("%Y-%m-%d")
                cursor.execute(
                    "INSERT INTO assignments (title, subject, category, deadline_date, date) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (title, subject, category, deadline_date, deadline_date)
                )
                item_id = cursor.fetchone()['id']
                return self._send_json(201, {"id": item_id, "title": title, "subject": subject, "category": category, "deadline_date": deadline_date, "date": deadline_date})

            elif "exam" in path:
                title = body.get("title") or body.get("exam_name") or "Exam"
                exact_date = body.get("exact_date") or body.get("date") or time.strftime("%Y-%m-%d")
                cursor.execute(
                    "INSERT INTO exams (title, exam_name, exact_date, date) VALUES (%s, %s, %s, %s) RETURNING id",
                    (title, title, exact_date, exact_date)
                )
                item_id = cursor.fetchone()['id']
                return self._send_json(201, {"id": item_id, "title": title, "exam_name": title, "exact_date": exact_date, "date": exact_date})

            else:
                return self._send_json(200, body)

        except Exception as e:
            return self._send_json(500, {"detail": str(e)})
        finally:
            if 'conn' in locals() and conn:
                conn.close()

    def do_DELETE(self):
        path = self.path.split("?")[0].lower().rstrip("/")
        item_id = path.split("/")[-1]

        try:
            conn = get_db()
            cursor = conn.cursor()

            if "todo" in path or "task" in path:
                cursor.execute("DELETE FROM todos WHERE id = %s", (item_id,))
            elif "bookmark" in path or "portal" in path:
                cursor.execute("DELETE FROM bookmarks WHERE id = %s", (item_id,))
            elif "hr" in path:
                cursor.execute("DELETE FROM hr_contacts WHERE id = %s", (item_id,))
            elif "project" in path:
                cursor.execute("DELETE FROM projects WHERE id = %s", (item_id,))
            elif "assignment" in path or "deadline" in path:
                cursor.execute("DELETE FROM assignments WHERE id = %s", (item_id,))
            elif "exam" in path:
                cursor.execute("DELETE FROM exams WHERE id = %s", (item_id,))

            return self._send_json(200, {"status": "deleted", "id": item_id})
        except Exception as e:
            return self._send_json(500, {"detail": str(e)})
        finally:
            if 'conn' in locals() and conn:
                conn.close()

    def do_PUT(self):
        return self._send_json(200, {"status": "updated"})

if __name__ == "__main__":
    server_address = ("127.0.0.1", 8000)
    httpd = HTTPServer(server_address, handler)
    print("🚀 Cloud-connected backend server running on http://127.0.0.1:8000")
    httpd.serve_forever()