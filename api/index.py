import sys
import os

# Set root directory and backend directory paths dynamically
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for path in [root_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database and Model Imports with Fallback
try:
    from backend.app.database import engine, Base
    from backend.app import models
    from backend.app.routers import auth, links, exams, projects, todos, daily_tasks
except ImportError:
    from app.database import engine, Base
    from app import models
    from app.routers import auth, links, exams, projects, todos, daily_tasks

# Auto-create all tables in the database on Serverless startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as err:
    print(f"Database table check warning: {err}")

app = FastAPI(title="JPW Services API", docs_url="/api/docs", openapi_url="/api/openapi.json")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(links.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(todos.router, prefix="/api")
app.include_router(daily_tasks.router, prefix="/api")

@app.get("/api")
def root():
    return {"status": "ok", "message": "JPW Services Backend is running smoothly!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}