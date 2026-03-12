from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models import UserRole, TaskDifficulty, TaskType


# ─── Auth ───────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.student
    learning_goal: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ─── User ────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    level: Optional[str] = None
    learning_goal: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class UserLevelUpdate(BaseModel):
    level: str


class UserGoalUpdate(BaseModel):
    learning_goal: str


# ─── Course ──────────────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_published: Optional[bool] = None


class CourseOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    is_published: bool
    teacher_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Module ──────────────────────────────────────────────────────────────────

class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None


class ModuleOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    order: int
    course_id: int

    class Config:
        from_attributes = True


# ─── Lesson ──────────────────────────────────────────────────────────────────

class LessonCreate(BaseModel):
    title: str
    content: Optional[str] = None
    order: int = 0


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = None


class LessonOut(BaseModel):
    id: int
    title: str
    content: Optional[str]
    order: int
    module_id: int

    class Config:
        from_attributes = True


# ─── Task ────────────────────────────────────────────────────────────────────

TASK_TOPICS = [
    "loops", "functions", "data_types", "oop",
    "strings", "lists_dicts", "algorithms", "files",
    "exceptions", "recursion",
]


class TaskCreate(BaseModel):
    title: str
    description: str
    difficulty: TaskDifficulty = TaskDifficulty.easy
    task_type: TaskType = TaskType.lesson
    level: Optional[str] = None
    topic: Optional[str] = None
    starter_code: Optional[str] = None
    expected_output: Optional[str] = None
    test_cases: Optional[str] = None
    lesson_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[TaskDifficulty] = None
    level: Optional[str] = None
    topic: Optional[str] = None
    starter_code: Optional[str] = None
    expected_output: Optional[str] = None
    test_cases: Optional[str] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: str
    difficulty: TaskDifficulty
    task_type: TaskType
    level: Optional[str] = None
    topic: Optional[str] = None
    starter_code: Optional[str]
    expected_output: Optional[str]
    test_cases: Optional[str]
    lesson_id: Optional[int]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Group ───────────────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    name: str
    course_id: Optional[int] = None


class GroupOut(BaseModel):
    id: int
    name: str
    invite_code: str
    teacher_id: int
    course_id: Optional[int]
    created_at: datetime
    student_count: int = 0

    class Config:
        from_attributes = True


# ─── Enrollment ──────────────────────────────────────────────────────────────

class JoinByCode(BaseModel):
    invite_code: str


# ─── Submission ──────────────────────────────────────────────────────────────

class SubmissionCreate(BaseModel):
    task_id: int
    code: str


class SubmissionOut(BaseModel):
    id: int
    task_id: int
    code: str
    score: Optional[float]
    ai_feedback: Optional[str]
    is_correct: bool
    submitted_at: datetime

    class Config:
        from_attributes = True


# ─── Achievement ─────────────────────────────────────────────────────────────

class AchievementOut(BaseModel):
    id: int
    key: str
    name: str
    emoji: str
    earned_at: datetime

    class Config:
        from_attributes = True


# ─── AI ──────────────────────────────────────────────────────────────────────

class AIFeedbackRequest(BaseModel):
    task_description: str
    student_code: str
    question: Optional[str] = None


class AIFeedbackResponse(BaseModel):
    feedback: str
    hint_type: str  # "hint" | "error" | "success"


# Update forward refs
TokenResponse.model_rebuild()
