from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings


engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def run_migrations():
    with engine.connect() as conn:
        # Add new columns safely
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(300)"))

        # Create group_courses many2many table if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS group_courses (
                group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                PRIMARY KEY (group_id, course_id)
            )
        """))

        # Migrate existing course_id FK data into group_courses (run once, idempotent)
        conn.execute(text("""
            INSERT INTO group_courses (group_id, course_id)
            SELECT id, course_id FROM groups
            WHERE course_id IS NOT NULL
            ON CONFLICT DO NOTHING
        """))

        conn.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
