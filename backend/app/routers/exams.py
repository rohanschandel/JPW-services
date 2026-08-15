from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Exam, Assignment, User
from app.schemas import ExamCreate, ExamResponse, AssignmentCreate, AssignmentResponse
from app.routers.auth import SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter(tags=["Exams & Assignments"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ================= EXAMS ENDPOINTS =================
@router.get("/exams/", response_model=List[ExamResponse])
def get_exams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Exam).filter(Exam.user_id == current_user.id).order_by(Exam.exact_date.asc()).all()

@router.post("/exams/", response_model=ExamResponse)
def create_exam(exam: ExamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_exam = Exam(
        user_id=current_user.id,
        title=exam.title,
        from_date=exam.from_date,
        upto_date=exam.upto_date,
        exact_date=exam.exact_date
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return new_exam

@router.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    return {"message": "Deleted successfully"}

# ================= ASSIGNMENTS ENDPOINTS =================
@router.get("/assignments/", response_model=List[AssignmentResponse])
def get_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Assignment).filter(Assignment.user_id == current_user.id).order_by(Assignment.deadline_date.asc()).all()

@router.post("/assignments/", response_model=AssignmentResponse)
def create_assignment(assignment: AssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_assignment = Assignment(
        user_id=current_user.id,
        title=assignment.title,
        subject=assignment.subject,
        deadline_date=assignment.deadline_date
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Deleted successfully"}