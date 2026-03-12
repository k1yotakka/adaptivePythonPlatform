from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/teachers", response_model=list[schemas.UserOut])
def get_teachers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    return db.query(models.User).filter(models.User.role == models.UserRole.teacher).all()


@router.post("/teachers", response_model=schemas.UserOut, status_code=201)
def create_teacher(
    data: schemas.UserRegister,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=auth.hash_password(data.password),
        role=models.UserRole.teacher,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/teachers/{user_id}", status_code=204)
def delete_teacher(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == models.UserRole.teacher,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(user)
    db.commit()


@router.get("/students", response_model=list[schemas.UserOut])
def get_all_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    return db.query(models.User).filter(models.User.role == models.UserRole.student).all()
