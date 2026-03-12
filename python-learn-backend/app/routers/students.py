from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func, distinct
from datetime import date, timedelta
from collections import defaultdict

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/students", tags=["students"])

TOPIC_EMOJI = {
    "loops": "🔁", "functions": "⚙️", "oop": "🏗️",
    "lists_dicts": "🥷", "strings": "📝", "data_types": "📦",
    "algorithms": "🧮", "files": "📁", "exceptions": "⚠️",
    "recursion": "🔄", "variables": "🔤", "conditionals": "🔀",
}


def _topic_display(topic: str) -> str:
    return topic.replace("_", " ").title()


def _calc_streak(submissions):
    if not submissions:
        return 0
    unique_dates = sorted(
        set(s.submitted_at.date() for s in submissions if s.submitted_at),
        reverse=True
    )
    if not unique_dates:
        return 0
    streak = 0
    today = date.today()
    current = today
    for d in unique_dates:
        if d == current or d == current - timedelta(days=1):
            streak += 1
            current = d
        elif d < current - timedelta(days=1):
            break
    return streak


@router.get("/dashboard")
def get_student_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == current_user.id
    ).all()
    group_ids = [e.group_id for e in enrollments]

    groups = db.query(models.Group).filter(models.Group.id.in_(group_ids)).all() if group_ids else []
    course_ids = [g.course_id for g in groups if g.course_id]

    courses = db.query(models.Course).filter(models.Course.id.in_(course_ids)).all() if course_ids else []

    modules_data = []
    for course in courses:
        course_modules = db.query(models.Module).filter(
            models.Module.course_id == course.id
        ).order_by(models.Module.order).all()
        for module in course_modules:
            lesson_count = db.query(models.Lesson).filter(
                models.Lesson.module_id == module.id
            ).count()
            modules_data.append({
                "id": module.id,
                "title": module.title,
                "lesson_count": lesson_count,
                "course_title": course.title,
            })

    # Recent submissions with task_id for linking
    recent_submissions = (
        db.query(models.Submission)
        .filter(models.Submission.student_id == current_user.id)
        .order_by(models.Submission.submitted_at.desc())
        .limit(5)
        .all()
    )
    recent_tasks = []
    for sub in recent_submissions:
        task = db.query(models.Task).filter(models.Task.id == sub.task_id).first()
        if task:
            recent_tasks.append({
                "id": sub.id,
                "task_id": task.id,
                "task_title": task.title,
                "score": sub.score,
                "is_correct": sub.is_correct,
                "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            })

    all_subs = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id
    ).all()

    # Solved unique tasks count
    solved_tasks = len(set(s.task_id for s in all_subs if s.is_correct))

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "level": current_user.level,
        },
        "streak": _calc_streak(all_subs),
        "solved_tasks": solved_tasks,
        "total_submissions": len(all_subs),
        "modules": modules_data,
        "recent_tasks": recent_tasks,
        "enrolled_groups": len(group_ids),
    }


@router.get("/achievements", response_model=list[schemas.AchievementOut])
def get_my_achievements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Achievement).filter(
        models.Achievement.user_id == current_user.id
    ).order_by(models.Achievement.earned_at.desc()).all()


@router.get("/available-achievements")
def get_available_achievements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Returns all possible achievements with earned status and progress for the current student."""
    earned = {a.key: a for a in current_user.achievements}

    result = [{
        "key": "first_steps",
        "name": "First Steps",
        "emoji": "👣",
        "description": "Submit your first correct solution",
        "is_earned": "first_steps" in earned,
        "earned_at": earned["first_steps"].earned_at.isoformat() if "first_steps" in earned else None,
        "progress": None,
    }]

    topics = (
        db.query(models.Task.topic)
        .filter(
            models.Task.task_type == models.TaskType.standalone,
            models.Task.topic != None,
        )
        .distinct()
        .order_by(models.Task.topic)
        .all()
    )

    for (topic,) in topics:
        if not topic:
            continue
        ach_key = f"topic_{topic}"
        # Apply same level filter as GET /tasks endpoint
        total_query = db.query(models.Task).filter(
            models.Task.task_type == models.TaskType.standalone,
            models.Task.topic == topic,
        )
        if current_user.level:
            total_query = total_query.filter(
                (models.Task.level == None) | (models.Task.level == current_user.level)
            )
        total = total_query.count()
        solved_query = (
            db.query(models.Submission.task_id)
            .join(models.Task)
            .filter(
                models.Submission.student_id == current_user.id,
                models.Submission.is_correct == True,
                models.Task.topic == topic,
                models.Task.task_type == models.TaskType.standalone,
            )
        )
        if current_user.level:
            solved_query = solved_query.filter(
                (models.Task.level == None) | (models.Task.level == current_user.level)
            )
        solved = solved_query.distinct().count()
        topic_display = _topic_display(topic)
        is_earned = ach_key in earned
        result.append({
            "key": ach_key,
            "name": f"{topic_display} Master",
            "emoji": TOPIC_EMOJI.get(topic, "🏆"),
            "description": f"Solve all {total} tasks in {topic_display}",
            "is_earned": is_earned,
            "earned_at": earned[ach_key].earned_at.isoformat() if is_earned else None,
            "progress": {"solved": solved, "total": total},
        })

    return result


@router.get("/progress")
def get_student_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id
    ).all()

    total_submissions = len(submissions)

    # Group by task_id to get per-task stats
    by_task = defaultdict(list)
    for s in submissions:
        by_task[s.task_id].append(s)

    tasks_attempted = len(by_task)
    tasks_solved = sum(1 for subs in by_task.values() if any(s.is_correct for s in subs))
    tasks_failed = tasks_attempted - tasks_solved

    scored = [s.score for s in submissions if s.score is not None]
    avg_score = round(sum(scored) / len(scored), 1) if scored else 0

    # Topic breakdown — solved tasks per topic
    topic_stats = []
    if by_task:
        task_ids = list(by_task.keys())
        tasks = db.query(models.Task).filter(models.Task.id.in_(task_ids)).all()
        topic_map = defaultdict(lambda: {"attempted": 0, "solved": 0})
        for t in tasks:
            topic_key = t.topic or "other"
            topic_map[topic_key]["attempted"] += 1
            if any(s.is_correct for s in by_task[t.id]):
                topic_map[topic_key]["solved"] += 1

        for topic_key, data in sorted(topic_map.items()):
            topic_stats.append({
                "topic": topic_key,
                "label": _topic_display(topic_key),
                "attempted": data["attempted"],
                "solved": data["solved"],
            })

    return {
        "total_submissions": total_submissions,
        "tasks_attempted": tasks_attempted,
        "tasks_solved": tasks_solved,
        "tasks_failed": tasks_failed,
        "avg_score": avg_score,
        "completion_rate": round(tasks_solved / tasks_attempted * 100, 1) if tasks_attempted > 0 else 0,
        "topic_stats": topic_stats,
        "streak": _calc_streak(submissions),
    }
