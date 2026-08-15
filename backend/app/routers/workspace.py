from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt
import os
from app.database import get_db
from app.models import WorkspaceNote
from app.schemas import NoteSave, NoteResponse

router = APIRouter(prefix="/workspace", tags=["Workspace"])
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

@router.get("/", response_model=Optional[NoteResponse])
def get_note(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    note = db.query(WorkspaceNote).filter(WorkspaceNote.user_id == user_id).first()
    if not note:
        return {"id": 0, "title": "My Workspace Notebook", "content": ""}
    return note

@router.post("/", response_model=NoteResponse)
def save_note(data: NoteSave, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    note = db.query(WorkspaceNote).filter(WorkspaceNote.user_id == user_id).first()
    if note:
        note.content = data.content
        note.title = data.title
    else:
        note = WorkspaceNote(user_id=user_id, title=data.title, content=data.content)
        db.add(note)
    db.commit()
    db.refresh(note)
    return note