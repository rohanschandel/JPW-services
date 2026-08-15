from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import HRContact, User
from app.schemas import HRContactCreate, HRContactResponse
from app.routers.auth import SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter(prefix="/hr", tags=["HR Contacts"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/", response_model=List[HRContactResponse])
def get_hr_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(HRContact).filter(HRContact.user_id == current_user.id).order_by(HRContact.id.desc()).all()

@router.post("/", response_model=HRContactResponse, status_code=status.HTTP_201_CREATED)
def create_hr_contact(contact: HRContactCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_contact = HRContact(
        user_id=current_user.id,
        hr_name=contact.hr_name.strip(),
        company_name=contact.company_name.strip(),
        hr_number=contact.hr_number.strip() if contact.hr_number else "",
        email_id=contact.email_id.strip() if contact.email_id else "",
        location=contact.location.strip() if contact.location else ""
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hr_contact(contact_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contact = db.query(HRContact).filter(HRContact.id == contact_id, HRContact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return None