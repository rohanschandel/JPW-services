from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from jose import jwt
import os
from app.database import get_db
from app.models import Bookmark
from app.schemas import BookmarkCreate, BookmarkResponse

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_jpw_services_2026_secure")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def get_current_user_id(authorization: str = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token missing")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

@router.get("/", response_model=List[BookmarkResponse])
def get_bookmarks(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return db.query(Bookmark).filter(Bookmark.user_id == user_id).order_by(Bookmark.id.desc()).all()

@router.post("/", response_model=BookmarkResponse)
def add_bookmark(data: BookmarkCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    url = data.url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        url = "https://" + url

    new_bookmark = Bookmark(user_id=user_id, name=data.name.strip(), url=url)
    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)
    return new_bookmark

@router.delete("/{bookmark_id}")
def delete_bookmark(bookmark_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id, Bookmark.user_id == user_id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()
    return {"status": "deleted"}