from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Emoji hints for known topic keys — fallback to 🏆 for custom topics
TOPIC_EMOJI = {
    "loops": "🔁", "functions": "⚙️", "oop": "🏗️",
    "lists_dicts": "🥷", "strings": "📝", "data_types": "📦",
    "algorithms": "🧮", "files": "📁", "exceptions": "⚠️",
    "recursion": "🔄", "variables": "🔤", "conditionals": "🔀",
}


def _award_achievements(db: Session, student: models.User):
    existing_keys = {a.key for a in student.achievements}

    # First Steps — first correct submission ever
    if "first_steps" not in existing_keys:
        has_correct = db.query(models.Submission).filter(
            models.Submission.student_id == student.id,
            models.Submission.is_correct == True,
        ).first()
        if has_correct:
            db.add(models.Achievement(
                user_id=student.id, key="first_steps",
                name="First Steps", emoji="👣"
            ))

    # Dynamic topic achievements — earn by solving ALL standalone tasks in a topic
    topics = (
        db.query(models.Task.topic)
        .filter(
            models.Task.task_type == models.TaskType.standalone,
            models.Task.topic != None,
        )
        .distinct()
        .all()
    )

    for (topic,) in topics:
        if not topic:
            continue
        ach_key = f"topic_{topic}"
        if ach_key in existing_keys:
            continue
        # Apply level filter - count only tasks matching student's level
        total_query = db.query(models.Task).filter(
            models.Task.task_type == models.TaskType.standalone,
            models.Task.topic == topic,
        )
        if student.level:
            total_query = total_query.filter(
                (models.Task.level == None) | (models.Task.level == student.level)
            )
        total = total_query.count()
        
        solved_query = (
            db.query(models.Submission.task_id)
            .join(models.Task)
            .filter(
                models.Submission.student_id == student.id,
                models.Submission.is_correct == True,
                models.Task.topic == topic,
                models.Task.task_type == models.TaskType.standalone,
            )
        )
        if student.level:
            solved_query = solved_query.filter(
                (models.Task.level == None) | (models.Task.level == student.level)
            )
        solved = solved_query.distinct().count()
        
        if total > 0 and solved >= total:
            topic_display = topic.replace("_", " ").title()
            db.add(models.Achievement(
                user_id=student.id,
                key=ach_key,
                name=f"{topic_display} Master",
                emoji=TOPIC_EMOJI.get(topic, "🏆"),
            ))

    db.commit()


@router.get("/topics")
def get_topics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Returns all distinct topic values from existing tasks."""
    rows = (
        db.query(models.Task.topic)
        .filter(models.Task.topic != None)
        .distinct()
        .order_by(models.Task.topic)
        .all()
    )
    return [r[0] for r in rows if r[0]]


@router.get("/", response_model=list[schemas.TaskOut])
def get_tasks(
    task_type: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = db.query(models.Task)
    if task_type:
        query = query.filter(models.Task.task_type == task_type)
        # Students only see tasks matching their level (or tasks with no level restriction)
        if task_type == "standalone" and current_user.role == models.UserRole.student:
            if current_user.level:
                query = query.filter(
                    (models.Task.level == None) | (models.Task.level == current_user.level)
                )
    elif current_user.role == models.UserRole.student:
        query = query.filter(models.Task.task_type == models.TaskType.standalone)
        if current_user.level:
            query = query.filter(
                (models.Task.level == None) | (models.Task.level == current_user.level)
            )
    else:
        # Teacher sees only their own tasks
        query = query.filter(models.Task.created_by == current_user.id)
    return query.all()


@router.post("/", response_model=schemas.TaskOut, status_code=201)
def create_task(
    data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    task = models.Task(**data.model_dump(), created_by=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.created_by == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(task, key, val)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_teacher),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.created_by == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


# ─── Submissions ─────────────────────────────────────────────────────────────

def _evaluate_submission(code, task):
    if not task.expected_output:
        return False, 0.0

    import subprocess, tempfile, os, sys

    try:
        # Write student code to a temp file and run it
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
            f.write(code)
            tmp_path = f.name

        result = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True, text=True, timeout=10, encoding='utf-8'
        )
        os.unlink(tmp_path)

        # Clean both outputs: remove empty lines, strip trailing spaces
        actual_lines = [line.rstrip() for line in result.stdout.replace("\r", "").strip().split("\n") if line.strip()]
        expected_lines = [line.rstrip() for line in task.expected_output.replace("\r", "").strip().split("\n") if line.strip()]

        # Case 1: exact match
        if actual_lines == expected_lines:
            return True, 100.0

        # Case 2: output is repeated (student's demo prints + test harness both ran)
        if len(actual_lines) > 0 and len(actual_lines) % len(expected_lines) == 0:
            times = len(actual_lines) // len(expected_lines)
            if times >= 2 and actual_lines == expected_lines * times:
                return True, 100.0

        # Case 3: expected output is at the end of actual output
        if len(actual_lines) >= len(expected_lines):
            tail = actual_lines[-len(expected_lines):]
            if tail == expected_lines:
                return True, 100.0

        return False, 0.0
    except Exception:
        return False, 0.0


@router.post("/{task_id}/submit", response_model=schemas.SubmissionOut, status_code=201)
def submit_task(
    task_id: int,
    data: schemas.SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if already solved — don't allow re-submit
    already_solved = db.query(models.Submission).filter(
        models.Submission.task_id == task_id,
        models.Submission.student_id == current_user.id,
        models.Submission.is_correct == True,
    ).first()
    if already_solved:
        raise HTTPException(status_code=400, detail="Task already solved")

    is_correct, score = _evaluate_submission(data.code, task)

    submission = models.Submission(
        student_id=current_user.id,
        task_id=task_id,
        code=data.code,
        is_correct=is_correct,
        score=score,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    if current_user.role == models.UserRole.student:
        db.refresh(current_user)
        _award_achievements(db, current_user)

    return submission


@router.get("/{task_id}/my-submissions", response_model=list[schemas.SubmissionOut])
def get_my_submissions(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Submission).filter(
        models.Submission.task_id == task_id,
        models.Submission.student_id == current_user.id,
    ).order_by(models.Submission.submitted_at.desc()).all()


@router.get("/{task_id}/status")
def get_task_status(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    subs = db.query(models.Submission).filter(
        models.Submission.task_id == task_id,
        models.Submission.student_id == current_user.id,
    ).all()
    if not subs:
        return {"status": "not_started", "attempts": 0, "is_solved": False}
    is_solved = any(s.is_correct for s in subs)
    last_sub = max(subs, key=lambda s: s.submitted_at)
    return {
        "status": "solved" if is_solved else "attempted",
        "attempts": len(subs),
        "is_solved": is_solved,
        "last_code": last_sub.code,
        "last_score": last_sub.score,
    }
