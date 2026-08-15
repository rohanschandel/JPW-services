import sys
import os
import traceback

# Setup paths dynamically
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Safe dynamic backend imports
try:
    from backend.app.database import engine, Base
    from backend.app import models
    from backend.app.routers import auth, todos, links, exams, projects
except ImportError:
    from app.database import engine, Base
    from app import models
    from app.routers import auth, todos, links, exams, projects

# Ensure SQLite tables exist before serving requests
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Table Init Error: {e}")

app = FastAPI(title="JPW Services API")

# Global Exception Handler taaki exact crash reason UI/Network me dikh jaye
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = traceback.format_exc()
    print("CRITICAL SERVERLESS EXCEPTION:", error_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": error_msg}
    )

# CORS setup
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
    return {"status": "ok", "message": "JPW Services Backend is running!"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}