from http.server import BaseHTTPRequestHandler
import json
import hashlib
import secrets
import base64
import hmac
import time
import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_jpw_services_2026_secure")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/jpw_services.db")

# Supabase requires standard postgresql:// prefix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    if "sqlite" in DATABASE_URL:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
except Exception as e:
    print(f"Engine Init Error: {e}")
    DATABASE_URL = "sqlite:////tmp/jpw_services.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Schema Warning: {e}")

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
        path = self.path.split("?")[0].lower()

        if "me" in path or "profile" in path:
            return self._send_json(200, {"id": 1, "full_name": "Rohan Singh", "email": "rohanschandel@gmail.com"})

        if "stats" in path or "count" in path or "summary" in path:
            return self._send_json(200, {"todos": 0, "links": 0, "exams": 0, "projects": 0, "assignments": 0, "hr": 0, "workspace": 0})

        if "quote" in path:
            return self._send_json(200, {"quote": "Focus is a muscle. The more you practice it, the stronger it becomes.", "author": "JPW"})

        return self._send_json(200, [])

    def do_POST(self):
        path = self.path.split("?")[0].lower()
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = {}

        db = SessionLocal()

        try:
            # Registration
            if "register" in path:
                full_name = body.get("full_name", "").strip() or "User"
                email = body.get("email", "").lower().strip()
                password = body.get("password", "")

                if not email or not password:
                    return self._send_json(400, {"detail": "Email and password are required"})

                existing_user = db.query(User).filter(User.email == email).first()
                if existing_user:
                    return self._send_json(400, {"detail": "Account already exists with this email."})

                hashed_pwd = get_password_hash(password)
                new_user = User(full_name=full_name, email=email, hashed_password=hashed_pwd)
                db.add(new_user)
                db.commit()
                db.refresh(new_user)

                token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
                return self._send_json(201, {
                    "access_token": token,
                    "token_type": "bearer",
                    "user": {"id": new_user.id, "full_name": new_user.full_name, "email": new_user.email}
                })

            # Login
            elif "login" in path:
                email = body.get("email", "").lower().strip()
                password = body.get("password", "")

                user = db.query(User).filter(User.email == email).first()
                if not user or not verify_password(password, user.hashed_password):
                    return self._send_json(401, {"detail": "Invalid email or password."})

                token = create_access_token({"sub": str(user.id), "email": user.email})
                return self._send_json(200, {
                    "access_token": token,
                    "token_type": "bearer",
                    "user": {"id": user.id, "full_name": user.full_name, "email": user.email}
                })

            else:
                return self._send_json(200, {"status": "success", "data": body})

        except Exception as err:
            return self._send_json(500, {"detail": str(err)})
        finally:
            db.close()

    def do_PUT(self):
        return self._send_json(200, {"status": "updated"})

    def do_DELETE(self):
        return self._send_json(200, {"status": "deleted"})