from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import engine, Base, run_migrations
from app.routers import auth, courses, tasks, groups, ai, admin, students, practice

# Создаём все таблицы при старте
Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(title="PyLearn API", version="1.0.0")

# Serve uploaded files (avatars, etc.)
static_dir = os.path.join(os.path.dirname(__file__), '..', 'static')
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(courses.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(groups.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(practice.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "PyLearn API is running"}
