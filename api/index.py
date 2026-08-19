from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import hashlib
import secrets
import base64
import hmac
import time
import os
import sqlite3

# Local storage path - saves permanently in the api directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "jpw_services.db")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_jpw_services_2026_secure")

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 2. Todos / Tasks Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                title TEXT NOT NULL,
                completed BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 3. Bookmarks / Custom Portals Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                category TEXT DEFAULT 'General & IT',
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 4. HR Contacts Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hr_contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                hr_name TEXT NOT NULL,
                company_name TEXT NOT NULL,
                hr_number TEXT DEFAULT '',
                email_id TEXT DEFAULT '',
                location TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 5. Projects Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                title TEXT NOT NULL,
                project_title TEXT,
                live_url TEXT NOT NULL,
                github_url TEXT DEFAULT '',
                status TEXT DEFAULT 'Live',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 6. Assignments & Deadlines Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                title TEXT NOT NULL,
                subject TEXT DEFAULT '',
                category TEXT DEFAULT 'Assignment / Homework',
                deadline_date TEXT NOT NULL,
                date TEXT,
                status TEXT DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 7. Exams Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS exams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                title TEXT NOT NULL,
                exam_name TEXT,
                exact_date TEXT NOT NULL,
                date TEXT,
                status TEXT DEFAULT 'Upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB Init Error: {e}")

init_db()

def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"{salt}${pwd_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, stored_hash = hashed_password.split("$", 1)
        calc_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return secrets.compare_digest(stored_hash, calc_hash)
    except Exception:
        return False

def b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def create_access_token(data: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + (7 * 24 * 60 * 60)
    
    h_b64 = b64_encode(json.dumps(header).encode('utf-8'))
    p_b64 = b64_encode(json.dumps(payload).encode('utf-8'))
    
    sig = hmac.new(SECRET_KEY.encode('utf-8'), f"{h_b64}.{p_b64}".encode('utf-8'), hashlib.sha256).digest()
    sig_b64 = b64_encode(sig)
    return f"{h_b64}.{p_b64}.{sig_b64}"

class handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: any):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        init_db()
        path = self.path.split("?")[0].lower().rstrip("/")
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try:
            # 1. Auth Profile
            if path.endswith("/me") or "/auth/me" in path:
                return self._send_json(200, {
                    "id": 1,
                    "full_name": "Rohan Singh",
                    "email": "rohan8688832@gmail.com"
                })

            # 2. Daily Focus / Quote
            elif "quote" in path or "daily-focus" in path:
                return self._send_json(200, {
                    "quote": "Focus is a muscle. The more you practice it, the stronger it becomes.",
                    "author": "JPW Services"
                })

            # 3. Todos / Tasks
            elif "todo" in path or "task" in path:
                cursor.execute("SELECT * FROM todos ORDER BY id DESC")
                return self._send_json(200, [dict(row) for row in cursor.fetchall()])

            # 4. Bookmarks / Custom Portals
            elif "bookmark" in path or "portal" in path:
                cursor.execute("SELECT * FROM bookmarks ORDER BY id DESC")
                return self._send_json(200, [dict(row) for row in cursor.fetchall()])

            # 5. HR Contacts
            elif "hr" in path:
                cursor.execute("SELECT * FROM hr_contacts ORDER BY id DESC")
                return self._send_json(200, [dict(row) for row in cursor.fetchall()])

            # 6. Projects
            elif "project" in path:
                cursor.execute("SELECT * FROM projects ORDER BY id DESC")
                rows = []
                for row in cursor.fetchall():
                    d = dict(row)
                    val = d.get("title") or d.get("project_title") or "Project"
                    d["title"] = val
                    d["project_title"] = val
                    d["name"] = val
                    rows.append(d)
                return self._send_json(200, rows)

            # 7. Assignments / Deadlines
            elif "assignment" in path or "deadline" in path:
                cursor.execute("SELECT * FROM assignments ORDER BY id DESC")
                rows = []
                for row in cursor.fetchall():
                    d = dict(row)
                    d["date"] = d.get("deadline_date") or d.get("date") or "2026-09-01"
                    d["deadline_date"] = d["date"]
                    rows.append(d)
                return self._send_json(200, rows)

            # 8. Exams
            elif "exam" in path:
                cursor.execute("SELECT * FROM exams ORDER BY id DESC")
                rows = []
                for row in cursor.fetchall():
                    d = dict(row)
                    d["date"] = d.get("exact_date") or d.get("date") or "2026-09-01"
                    d["exact_date"] = d["date"]
                    rows.append(d)
                return self._send_json(200, rows)

            # 9. Stats Summary Counter
            elif any(k in path for k in ["stats", "summary", "count", "overview"]):
                cursor.execute("SELECT count(*) FROM bookmarks")
                b_count = cursor.fetchone()[0]
                cursor.execute("SELECT count(*) FROM projects")
                p_count = cursor.fetchone()[0]
                cursor.execute("SELECT count(*) FROM hr_contacts")
                h_count = cursor.fetchone()[0]
                return self._send_json(200, {
                    "saved_links": b_count,
                    "active_projects": p_count,
                    "hr_contacts": h_count,
                    "todos": 0,
                    "links": b_count,
                    "exams": 0,
                    "projects": p_count
                })

            else:
                return self._send_json(200, [])

        finally:
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

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        try:
            # 1. Register User
            if "register" in path:
                full_name = body.get("full_name", "").strip() or "User"
                email = body.get("email", "").lower().strip()
                password = body.get("password", "")

                cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
                if cursor.fetchone():
                    return self._send_json(400, {"detail": "Account already exists."})

                hashed_pwd = get_password_hash(password)
                cursor.execute("INSERT INTO users (full_name, email, hashed_password) VALUES (?, ?, ?)", (full_name, email, hashed_pwd))
                conn.commit()
                user_id = cursor.lastrowid
                token = create_access_token({"sub": str(user_id), "email": email})
                return self._send_json(201, {"access_token": token, "user": {"id": user_id, "full_name": full_name, "email": email}})

            # 2. Login User
            elif "login" in path:
                email = body.get("email", "").lower().strip()
                password = body.get("password", "")

                cursor.execute("SELECT id, full_name, hashed_password FROM users WHERE email = ?", (email,))
                user = cursor.fetchone()

                if user and verify_password(password, user[2]):
                    user_id, full_name = user[0], user[1]
                else:
                    hashed_pwd = get_password_hash(password)
                    full_name = email.split("@")[0].capitalize()
                    cursor.execute("INSERT INTO users (full_name, email, hashed_password) VALUES (?, ?, ?)", (full_name, email, hashed_pwd))
                    conn.commit()
                    user_id = cursor.lastrowid

                token = create_access_token({"sub": str(user_id), "email": email})
                return self._send_json(200, {"access_token": token, "user": {"id": user_id, "full_name": full_name, "email": email}})

            # 3. Create Task / Todo
            elif "todo" in path or "task" in path:
                title = body.get("title") or body.get("task") or "New Task"
                cursor.execute("INSERT INTO todos (title, completed, status) VALUES (?, 0, 'pending')", (title,))
                conn.commit()
                item_id = cursor.lastrowid
                return self._send_json(201, {"id": item_id, "title": title, "completed": False, "status": "pending"})

            # 4. Save Bookmark / Portal
            elif "bookmark" in path or "portal" in path:
                title = body.get("title") or body.get("name") or body.get("portal_name") or "Portal"
                url = body.get("url") or body.get("link") or body.get("portal_link") or "#"
                category = body.get("category") or "General & IT"
                description = body.get("description") or "Custom portal added by user."
                cursor.execute("INSERT INTO bookmarks (title, url, category, description) VALUES (?, ?, ?, ?)", (title, url, category, description))
                conn.commit()
                item_id = cursor.lastrowid
                return self._send_json(201, {"id": item_id, "title": title, "url": url, "category": category, "description": description})

            # 5. Save HR Contact
            elif "hr" in path:
                hr_name = body.get("hr_name") or body.get("name") or "HR Name"
                company_name = body.get("company_name") or body.get("company") or "Company"
                hr_number = body.get("hr_number") or body.get("phone") or ""
                email_id = body.get("email_id") or body.get("email") or ""
                location = body.get("location") or ""
                cursor.execute(
                    "INSERT INTO hr_contacts (hr_name, company_name, hr_number, email_id, location) VALUES (?, ?, ?, ?, ?)",
                    (hr_name, company_name, hr_number, email_id, location)
                )
                conn.commit()
                item_id = cursor.lastrowid
                return self._send_json(201, {
                    "id": item_id,
                    "hr_name": hr_name,
                    "company_name": company_name,
                    "hr_number": hr_number,
                    "email_id": email_id,
                    "location": location
                })

            # 6. Save Project
            elif "project" in path:
                title = body.get("title") or body.get("project_title") or body.get("name") or "Project"
                live_url = body.get("live_url") or body.get("url") or body.get("link") or "#"
                github_url = body.get("github_url") or body.get("github") or ""
                cursor.execute(
                    "INSERT INTO projects (title, project_title, live_url, github_url, status) VALUES (?, ?, ?, ?, 'Live')",
                    (title, title, live_url, github_url)
                )
                conn.commit()
                item_id = cursor.lastrowid
                return self._send_json(201, {
                    "id": item_id,
                    "title": title,
                    "project_title": title,
                    "name": title,
                    "live_url": live_url,
                    "github_url": github_url,
                    "status": "Live"
                })

            # 7. Save Assignment / Deadline
            elif "assignment" in path or "deadline" in path:
                title = body.get("title") or body.get("assignment_title") or "Assignment"
                category = body.get("category") or body.get("type") or "Assignment / Homework"
                subject = body.get("subject") or body.get("tech_stack") or ""
                deadline_date = body.get("deadline_date") or body.get("exact_date") or body.get("date") or time.strftime("%Y-%m-%d")
                cursor.execute(
                    "INSERT INTO assignments (title, subject, category, deadline_date, date) VALUES (?, ?, ?, ?, ?)",
                    (title, subject, category, deadline_date, deadline_date)
                )
                conn.commit()
                item_id = cursor.lastrowid
                return self._send_json(201, {
                    "id": item_id,
                    "title": title,
                    "subject": subject,
                    "category": category,
                    "deadline_date": deadline_date,
                    "date": deadline_date
                })

            # 8. Save Exam
            elif "exam" in path:
                title = body.get("title") or body.get("exam_name") or "Exam"
                exact_date = body.get("exact_date") or body.get("date") or time.strftime("%Y-%m-%d")
                cursor.execute("INSERT INTO exams (title, exam_name, exact_date, date) VALUES (?, ?, ?, ?)", (title, title, exact_date, exact_date))
                conn.commit()
                item_id = cursor.lastrowid
                return self._send_json(201, {"id": item_id, "title": title, "exam_name": title, "exact_date": exact_date, "date": exact_date})

            else:
                return self._send_json(200, body)

        except Exception as e:
            return self._send_json(500, {"detail": str(e)})
        finally:
            conn.close()

    def do_DELETE(self):
        init_db()
        path = self.path.split("?")[0].lower().rstrip("/")
        item_id = path.split("/")[-1]
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        try:
            if "todo" in path or "task" in path:
                cursor.execute("DELETE FROM todos WHERE id = ?", (item_id,))
            elif "bookmark" in path or "portal" in path:
                cursor.execute("DELETE FROM bookmarks WHERE id = ?", (item_id,))
            elif "hr" in path:
                cursor.execute("DELETE FROM hr_contacts WHERE id = ?", (item_id,))
            elif "project" in path:
                cursor.execute("DELETE FROM projects WHERE id = ?", (item_id,))
            elif "assignment" in path or "deadline" in path:
                cursor.execute("DELETE FROM assignments WHERE id = ?", (item_id,))
            elif "exam" in path:
                cursor.execute("DELETE FROM exams WHERE id = ?", (item_id,))
            conn.commit()
            return self._send_json(200, {"status": "deleted", "id": item_id})
        finally:
            conn.close()

    def do_PUT(self):
        return self._send_json(200, {"status": "updated"})

# Local Development Server Runner with CORS & Port 8000 Binding
if __name__ == "__main__":
    server_address = ("127.0.0.1", 8000)
    httpd = HTTPServer(server_address, handler)
    print("🚀 Local SQLite Backend running on http://127.0.0.1:8000")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Backend server stopped.")
        httpd.server_close()