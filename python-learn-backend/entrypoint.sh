#!/bin/sh
set -e

# Ждём пока PostgreSQL поднимется
echo "Waiting for PostgreSQL..."
until python -c "
import psycopg2, os, sys
url = os.environ.get('DATABASE_URL', '')
# Парсим DATABASE_URL вручную для простой проверки
import re
m = re.match(r'postgresql\+psycopg2://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(.+)', url)
if not m:
    sys.exit(1)
user, password, host, port, dbname = m.groups()
port = int(port) if port else 5432
try:
    conn = psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password, connect_timeout=3)
    conn.close()
except Exception as e:
    print(e)
    sys.exit(1)
" 2>/dev/null; do
    echo "PostgreSQL not ready yet, retrying in 2s..."
    sleep 2
done
echo "PostgreSQL is ready."

# Создаём таблицы и запускаем миграции
echo "Running migrations..."
python -c "
from app.database import engine, Base, run_migrations
Base.metadata.create_all(bind=engine)
run_migrations()
print('Migrations done.')
"

# Засеиваем базу если она пустая (проверяем по отсутствию admin)
echo "Checking if seed is needed..."
python -c "
from app.database import SessionLocal
from app import models
db = SessionLocal()
count = db.query(models.User).filter(models.User.role == models.UserRole.admin).count()
db.close()
if count == 0:
    print('SEED_NEEDED')
else:
    print('ALREADY_SEEDED')
" > /tmp/seed_check.txt

if grep -q "SEED_NEEDED" /tmp/seed_check.txt; then
    echo "Seeding database with initial data..."
    PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python seed.py
    echo "Seed complete."
else
    echo "Database already seeded, skipping."
fi

# Запускаем сервер (без --reload в продакшне)
echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2