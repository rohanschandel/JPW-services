from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from jose import jwt
import os
from app.database import get_db
from app.models import Project
from app.schemas import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["Projects"])
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_jpw_services_2026_secure")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def get_current_user_id(authorization: str = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Token")
    try:
        payload = jwt.decode(authorization.split(" ")[1], SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Credentials")

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return db.query(Project).filter(Project.user_id == user_id).order_by(Project.id.desc()).all()

@router.post("/", response_model=ProjectResponse)
def add_project(data: ProjectCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    proj = Project(user_id=user_id, **data.dict())
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    proj = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"status": "deleted"}