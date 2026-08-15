from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, todos, links, exams, projects, hr, workspace

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JPW-services API", version="1.0.0")

# Robust CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="http://.*",
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers
app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(links.router)
app.include_router(exams.router)
app.include_router(projects.router)
app.include_router(hr.router)
app.include_router(workspace.router)

@app.get("/")
def health_check():
    return {"status": "running", "service": "JPW-services Full-Stack Backend"}