from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Todos
class TodoCreate(BaseModel):
    task: str

class TodoResponse(BaseModel):
    id: int
    task: str
    is_completed: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Bookmarks
class BookmarkCreate(BaseModel):
    name: str
    url: str

class BookmarkResponse(BaseModel):
    id: int
    name: str
    url: str
    created_at: datetime
    class Config:
        from_attributes = True

# Exams & Assignments
class ExamCreate(BaseModel):
    title: str
    from_date: Optional[str] = None
    upto_date: Optional[str] = None
    exact_date: str

class ExamResponse(BaseModel):
    id: int
    title: str
    from_date: Optional[str] = None
    upto_date: Optional[str] = None
    exact_date: str
    class Config:
        from_attributes = True

class AssignmentCreate(BaseModel):
    title: str
    subject: Optional[str] = None
    deadline_date: str

class AssignmentResponse(BaseModel):
    id: int
    title: str
    subject: Optional[str] = None
    deadline_date: str
    class Config:
        from_attributes = True

# Projects
class ProjectCreate(BaseModel):
    name: str
    live_url: str
    github_url: Optional[str] = None
    status: Optional[str] = "Live"

class ProjectResponse(BaseModel):
    id: int
    name: str
    live_url: str
    github_url: Optional[str] = None
    status: str
    class Config:
        from_attributes = True

# HR Contacts
class HRContactCreate(BaseModel):
    hr_name: str
    company_name: str
    hr_number: str
    email_id: str
    location: str

class HRContactResponse(BaseModel):
    id: int
    hr_name: str
    company_name: str
    hr_number: str
    email_id: str
    location: str
    class Config:
        from_attributes = True

# Workspace
class NoteSave(BaseModel):
    title: Optional[str] = "Personal Workspace Canvas"
    content: str

class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True