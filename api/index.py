import sys
import os

# 1. Setup paths so backend modules are discovered
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# Import backend modules safely
try:
    from backend.app.database import engine, Base
    from backend.app.routers import auth, todos, links, exams, projects
except ImportError:
    from app.database import engine, Base
    from app.routers import auth, todos, links, exams, projects

# Auto-initialize database tables in /tmp
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database init warning: {e}")

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

# Mount all routers
app.include_router(auth.router, prefix="/api")
app.include_router(todos.router, prefix="/api")
app.include_router(links.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(projects.router, prefix="/api")

@app.get("/api")
def root():
    return {"status": "ok", "message": "JPW Services Backend is Live!"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}

# Mangum serverless handler for AWS Lambda / Vercel Python runtime
handler = Mangum(app)