import os
import sys
import json
import base64
import hmac
import hashlib
import secrets
import time
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr

# Database Setup in writable /tmp directory for Vercel Serverless
DATABASE_URL = "sqlite:////tmp/jpw_services.db"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# Ensure database tables are created
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Table Init Error: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Schemas
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

app = FastAPI(title="JPW Services API")

# Global Exception Catcher
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_jpw_services_2026_secure")

# Pure Python Password Hashing (Zero Binary Dependency)
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

# Pure Native JWT Generator (Zero jose/cryptography dependency)
def b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def create_access_token(data: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + (7 * 24 * 60 * 60) # 7 Days Validity
    
    header_b64 = b64_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = b64_encode(json.dumps(payload).encode('utf-8'))
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = b64_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

# Register Route
@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    clean_email = user_data.email.lower().strip()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Account with this email already exists.")

    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        full_name=user_data.full_name.strip(),
        email=clean_email,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email
        }
    }

# Login Route
@app.post("/auth/login")
@app.post("/api/auth/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    clean_email = login_data.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email
        }
    }

@app.get("/")
@app.get("/api")
def root():
    return {"status": "ok", "message": "JPW Services Backend is Live!"}