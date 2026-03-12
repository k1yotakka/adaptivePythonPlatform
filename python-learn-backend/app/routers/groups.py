import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/groups", tags=["groups"])


def _generate_invite_code() -> str:
    return secrets.token_urlsafe(8)


@router.get("/", response_model=list[schemas.GroupOut])
def get_groups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    groups = db.query(models.Group).filter(models.Group.teacher_id == current_user.id).all()
    result = []
    for g in groups:
        count = db.query(models.Enrollment).filter(models.Enrollment.group_id == g.id).count()
        out = schemas.GroupOut.model_validate(g)
        out.student_count = count
        result.append(out)
    return result


@router.post("/", response_model=schemas.GroupOut, status_code=201)
def create_group(
    data: schemas.GroupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    group = models.Group(
        name=data.name,
        course_id=data.course_id,
        teacher_id=current_user.id,
        invite_code=_generate_invite_code(),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    out = schemas.GroupOut.model_validate(group)
    out.student_count = 0
    return out


@router.get("/{group_id}", response_model=schemas.GroupOut)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    group = db.query(models.Group).filter(
        models.Group.id == group_id,
        models.Group.teacher_id == current_user.id,
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    count = db.query(models.Enrollment).filter(models.Enrollment.group_id == group_id).count()
    out = schemas.GroupOut.model_validate(group)
    out.student_count = count
    return out


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    group = db.query(models.Group).filter(
        models.Group.id == group_id,
        models.Group.teacher_id == current_user.id,
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()


@router.get("/{group_id}/students", response_model=list[schemas.UserOut])
def get_group_students(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    group = db.query(models.Group).filter(
        models.Group.id == group_id,
        models.Group.teacher_id == current_user.id,
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.group_id == group_id).all()
    student_ids = [e.student_id for e in enrollments]
    return db.query(models.User).filter(models.User.id.in_(student_ids)).all()


@router.get("/{group_id}/stats")
def get_group_stats(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    group = db.query(models.Group).filter(
        models.Group.id == group_id,
        models.Group.teacher_id == current_user.id,
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.group_id == group_id
    ).all()
    student_ids = [e.student_id for e in enrollments]
    students = db.query(models.User).filter(models.User.id.in_(student_ids)).all() if student_ids else []

    student_stats = []
    for student in students:
        subs = db.query(models.Submission).filter(
            models.Submission.student_id == student.id
        ).all()
        by_task = defaultdict(list)
        for s in subs:
            by_task[s.task_id].append(s)
        solved = sum(1 for task_subs in by_task.values() if any(s.is_correct for s in task_subs))
        scored = [s.score for s in subs if s.score is not None]
        avg = round(sum(scored) / len(scored), 1) if scored else 0
        student_stats.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "level": student.level,
            "total_submissions": len(subs),
            "tasks_solved": solved,
            "tasks_attempted": len(by_task),
            "avg_score": avg,
        })

    return {
        "group_name": group.name,
        "student_count": len(students),
        "students": student_stats,
    }


@router.post("/join", response_model=schemas.GroupOut)
def join_group(
    data: schemas.JoinByCode,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.UserRole.student:
        raise HTTPException(status_code=403, detail="Only students can join groups")

    group = db.query(models.Group).filter(models.Group.invite_code == data.invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    already = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == current_user.id,
        models.Enrollment.group_id == group.id,
    ).first()
    if already:
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = models.Enrollment(student_id=current_user.id, group_id=group.id)
    db.add(enrollment)
    db.commit()

    count = db.query(models.Enrollment).filter(models.Enrollment.group_id == group.id).count()
    out = schemas.GroupOut.model_validate(group)
    out.student_count = count
    return out
