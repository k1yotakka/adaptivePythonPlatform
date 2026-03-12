from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[schemas.CourseOut])
def get_courses(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in (models.UserRole.teacher, models.UserRole.admin):
        return db.query(models.Course).filter(models.Course.teacher_id == current_user.id).all()
    # Студент видит только курсы своих групп
    enrolled_group_ids = [e.group_id for e in current_user.enrollments]
    groups = db.query(models.Group).filter(models.Group.id.in_(enrolled_group_ids)).all()
    course_ids = [g.course_id for g in groups if g.course_id]
    return db.query(models.Course).filter(models.Course.id.in_(course_ids)).all()


@router.post("/", response_model=schemas.CourseOut, status_code=201)
def create_course(
    data: schemas.CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    course = models.Course(**data.model_dump(), teacher_id=current_user.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/{course_id}", response_model=schemas.CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.patch("/{course_id}", response_model=schemas.CourseOut)
def update_course(
    course_id: int,
    data: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(course, key, val)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()


# ─── Modules ─────────────────────────────────────────────────────────────────

@router.get("/{course_id}/modules", response_model=list[schemas.ModuleOut])
def get_modules(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Module).filter(models.Module.course_id == course_id).order_by(models.Module.order).all()


@router.post("/{course_id}/modules", response_model=schemas.ModuleOut, status_code=201)
def create_module(
    course_id: int,
    data: schemas.ModuleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    module = models.Module(**data.model_dump(), course_id=course_id)
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.patch("/modules/{module_id}", response_model=schemas.ModuleOut)
def update_module(
    module_id: int,
    data: schemas.ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(module, key, val)
    db.commit()
    db.refresh(module)
    return module


@router.delete("/modules/{module_id}", status_code=204)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    db.delete(module)
    db.commit()


# ─── Lessons ─────────────────────────────────────────────────────────────────

@router.get("/modules/{module_id}/lessons", response_model=list[schemas.LessonOut])
def get_lessons(module_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Lesson).filter(models.Lesson.module_id == module_id).order_by(models.Lesson.order).all()


@router.post("/modules/{module_id}/lessons", response_model=schemas.LessonOut, status_code=201)
def create_lesson(
    module_id: int,
    data: schemas.LessonCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    lesson = models.Lesson(**data.model_dump(), module_id=module_id)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.get("/modules/{module_id}/lesson-progress")
def get_module_lesson_progress(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    lessons = db.query(models.Lesson).filter(
        models.Lesson.module_id == module_id
    ).order_by(models.Lesson.order).all()

    result = []
    for lesson in lessons:
        tasks = db.query(models.Task).filter(models.Task.lesson_id == lesson.id).all()
        if not tasks:
            result.append({"lesson_id": lesson.id, "is_completed": False, "has_tasks": False})
        else:
            all_solved = all(
                db.query(models.Submission).filter(
                    models.Submission.task_id == t.id,
                    models.Submission.student_id == current_user.id,
                    models.Submission.is_correct == True,
                ).first() is not None
                for t in tasks
            )
            result.append({"lesson_id": lesson.id, "is_completed": all_solved, "has_tasks": True})
    return result


@router.get("/lessons/{lesson_id}", response_model=schemas.LessonOut)
def get_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.patch("/lessons/{lesson_id}", response_model=schemas.LessonOut)
def update_lesson(
    lesson_id: int,
    data: schemas.LessonUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(lesson, key, val)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/lessons/{lesson_id}", status_code=204)
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    db.delete(lesson)
    db.commit()
