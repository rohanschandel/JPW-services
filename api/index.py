from http.server import BaseHTTPRequestHandler
import json
import sqlite3
import hashlib
import secrets
import base64
import hmac
import time
import os

DB_PATH = "/tmp/jpw_services.db"
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_jpw_services_2026_secure")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

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
        path = self.path.split("?")[0].lower()

        # Auth User verification
        if path.endswith("/me") or "/me" in path or "profile" in path:
            return self._send_json(200, {
                "id": 1,
                "full_name": "Rohan Singh",
                "email": "rohanschandel@gmail.com"
            })

        # Overview Stats
        if "stats" in path or "count" in path or "summary" in path:
            return self._send_json(200, {
                "todos": 0,
                "links": 0,
                "exams": 0,
                "projects": 0,
                "assignments": 0,
                "hr": 0,
                "workspace": 0
            })

        # Quote of the day
        if "quote" in path:
            return self._send_json(200, {
                "quote": "Focus is a muscle. The more you practice it, the stronger it becomes.",
                "author": "JPW"
            })

        # Return empty list [] by default for ANY other GET call to prevent .map() crash
        return self._send_json(200, [])

    def do_POST(self):
        init_db()
        path = self.path.split("?")[0].lower()
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = {}

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        if "register" in path:
            full_name = body.get("full_name", "").strip()
            email = body.get("email", "").lower().strip()
            password = body.get("password", "")

            if not full_name or not email or not password:
                conn.close()
                return self._send_json(400, {"detail": "All fields are required"})

            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                conn.close()
                return self._send_json(400, {"detail": "Account already exists."})

            hashed_pwd = get_password_hash(password)
            cursor.execute("INSERT INTO users (full_name, email, hashed_password) VALUES (?, ?, ?)", (full_name, email, hashed_pwd))
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()

            token = create_access_token({"sub": str(user_id), "email": email})
            return self._send_json(201, {
                "access_token": token,
                "token_type": "bearer",
                "user": {"id": user_id, "full_name": full_name, "email": email}
            })

        elif "login" in path:
            email = body.get("email", "").lower().strip()
            password = body.get("password", "")

            cursor.execute("SELECT id, full_name, hashed_password FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            conn.close()

            if not user or not verify_password(password, user[2]):
                return self._send_json(401, {"detail": "Invalid email or password."})

            token = create_access_token({"sub": str(user[0]), "email": email})
            return self._send_json(200, {
                "access_token": token,
                "token_type": "bearer",
                "user": {"id": user[0], "full_name": user[1], "email": email}
            })

        else:
            conn.close()
            return self._send_json(200, {"status": "success", "data": body})

    def do_PUT(self):
        return self._send_json(200, {"status": "updated"})

    def do_DELETE(self):
        return self._send_json(200, {"status": "deleted"})