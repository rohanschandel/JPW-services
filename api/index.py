import sys
import os

# Resolve paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base
from backend.app import models
from backend.app.routers import auth, todos, links, exams, projects

# Auto-create all tables on serverless boot
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Table sync notice: {e}")

app = FastAPI(title="JPW Services API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(todos.router, prefix="/api")
app.include_router(links.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(projects.router, prefix="/api")

@app.get("/api")
def root():
    return {"status": "ok", "message": "Backend API is live!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}