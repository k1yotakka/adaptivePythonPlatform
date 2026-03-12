import sqlite3

conn = sqlite3.connect('pylearn.db')
cursor = conn.cursor()

# Add topic column to tasks
try:
    cursor.execute('ALTER TABLE tasks ADD COLUMN topic TEXT')
    print('Added tasks.topic')
except Exception as e:
    print(f'tasks.topic: {e}')

# Create achievements table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        key VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        emoji VARCHAR(10) NOT NULL DEFAULT "trophy",
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
''')
print('achievements table OK')

conn.commit()
conn.close()
print('Migration complete')
