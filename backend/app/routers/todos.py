from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from jose import jwt
import os
from app.database import get_db
from app.models import Todo, User
from app.schemas import TodoCreate, TodoResponse

router = APIRouter(prefix="/todos", tags=["Todos"])
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

@router.get("/", response_model=List[TodoResponse])
def get_todos(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return db.query(Todo).filter(Todo.user_id == user_id).order_by(Todo.id.desc()).all()

@router.post("/", response_model=TodoResponse)
def add_todo(todo_data: TodoCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    new_todo = Todo(user_id=user_id, task=todo_data.task, is_completed=False)
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo

@router.patch("/{todo_id}/toggle")
def toggle_todo(todo_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.is_completed = not todo.is_completed
    db.commit()
    return {"status": "success", "is_completed": todo.is_completed}

@router.delete("/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
    return {"status": "deleted"}