from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


class TaskDifficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class TaskType(str, enum.Enum):
    lesson = "lesson"       # привязана к уроку
    standalone = "standalone"  # hackerrank-стиль, доступна всем


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    level = Column(String(50), nullable=True)          # beginner/intermediate/advanced
    learning_goal = Column(String(100), nullable=True)
    avatar_url = Column(String(300), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Отношения
    courses = relationship("Course", back_populates="teacher", foreign_keys="Course.teacher_id")
    groups = relationship("Group", back_populates="teacher", foreign_keys="Group.teacher_id")
    enrollments = relationship("Enrollment", back_populates="student")
    submissions = relationship("Submission", back_populates="student")
    achievements = relationship("Achievement", back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    teacher = relationship("User", back_populates="courses", foreign_keys=[teacher_id])
    modules = relationship("Module", back_populates="course", order_by="Module.order", cascade="all, delete-orphan")
    groups = relationship("Group", back_populates="course")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", order_by="Lesson.order", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)   # теория, markdown или html
    order = Column(Integer, default=0)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)

    module = relationship("Module", back_populates="lessons")
    tasks = relationship("Task", back_populates="lesson", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(Enum(TaskDifficulty), default=TaskDifficulty.easy)
    task_type = Column(Enum(TaskType), default=TaskType.lesson)
    level = Column(String(50), nullable=True)    # beginner/intermediate/advanced/null=all
    topic = Column(String(50), nullable=True)    # loops/functions/oop/etc
    starter_code = Column(Text, nullable=True)
    expected_output = Column(Text, nullable=True)
    test_cases = Column(Text, nullable=True)    # JSON строка
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)  # null для standalone
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lesson = relationship("Lesson", back_populates="tasks")
    submissions = relationship("Submission", back_populates="task")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    invite_code = Column(String(50), unique=True, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    teacher = relationship("User", back_populates="groups", foreign_keys=[teacher_id])
    course = relationship("Course", back_populates="groups")
    enrollments = relationship("Enrollment", back_populates="group", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="enrollments")
    group = relationship("Group", back_populates="enrollments")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    code = Column(Text, nullable=False)
    score = Column(Float, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="submissions")
    task = relationship("Task", back_populates="submissions")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key = Column(String(50), nullable=False)   # e.g. "first_steps", "loop_master"
    name = Column(String(100), nullable=False)
    emoji = Column(String(10), nullable=False, default="🏆")
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="achievements")
