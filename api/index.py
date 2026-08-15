import sys
import os

# Include paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.app.database import engine, Base
    from backend.app import models
    from backend.app.routers import auth, todos, links, exams, projects
except ImportError:
    from app.database import engine, Base
    from app import models
    from app.routers import auth, todos, links, exams, projects

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print("Database init error:", e)

app = FastAPI(title="JPW Services API", docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(todos.router, prefix="/api")
app.include_router(links.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(projects.router, prefix="/api")

@app.get("/api")
def root():
    return {"status": "ok", "message": "Backend API is online!"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}