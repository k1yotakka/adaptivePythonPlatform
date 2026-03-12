"""
Seed script for creating comprehensive initial data.
Run: python seed.py
"""
import secrets
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password
from app.config import settings

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if already seeded
if db.query(models.User).first():
    print("Database already has data, skipping seed.")
    db.close()
    exit()

# ─── Admin ──────────────────────────────────────────────────────────────────
admin = models.User(
    name="Admin",
    email=settings.ADMIN_EMAIL,
    password_hash=hash_password(settings.ADMIN_PASSWORD),
    role=models.UserRole.admin,
    level="advanced",
)
db.add(admin)

# ─── Teachers ────────────────────────────────────────────────────────────────
teacher1 = models.User(
    name="Aibek Seitkali",
    email="teacher@pylearn.com",
    password_hash=hash_password("teacher123"),
    role=models.UserRole.teacher,
)
teacher2 = models.User(
    name="Marat Nurlan",
    email="marat@pylearn.com",
    password_hash=hash_password("teacher123"),
    role=models.UserRole.teacher,
)
db.add_all([teacher1, teacher2])

# ─── Students ────────────────────────────────────────────────────────────────
students = [
    models.User(name="Amir Zhakupov", email="amir@student.com", password_hash=hash_password("student123"), role=models.UserRole.student, level="beginner", learning_goal="Learn Python for data science"),
    models.User(name="Aslan Dualtov", email="aslan@student.com", password_hash=hash_password("student123"), role=models.UserRole.student, level="intermediate", learning_goal="Improve coding skills"),
    models.User(name="Almas Zhasulanov", email="almas@student.com", password_hash=hash_password("student123"), role=models.UserRole.student, level="beginner", learning_goal="Start programming"),
    models.User(name="Dana Serik", email="dana@student.com", password_hash=hash_password("student123"), role=models.UserRole.student, level="intermediate", learning_goal="Prepare for interviews"),
    models.User(name="Erlan Bektas", email="erlan@student.com", password_hash=hash_password("student123"), role=models.UserRole.student, level="advanced", learning_goal="Master algorithms"),
]
for s in students:
    db.add(s)

db.commit()

# Refresh IDs
db.refresh(admin)
db.refresh(teacher1)
db.refresh(teacher2)
for s in students:
    db.refresh(s)

# ─── Courses ─────────────────────────────────────────────────────────────────
course1 = models.Course(
    title="Python Basics",
    description="Master the fundamentals of Python programming.",
    teacher_id=teacher1.id,
    is_published=True,
)
course2 = models.Course(
    title="Advanced Python",
    description="Deep dive into OOP, decorators, generators, and more.",
    teacher_id=teacher2.id,
    is_published=True,
)
db.add_all([course1, course2])
db.commit()
db.refresh(course1)
db.refresh(course2)

# ─── Modules ─────────────────────────────────────────────────────────────────
modules_data = [
    {"title": "Data Types & Variables", "order": 1, "course_id": course1.id, "desc": "Learn about Python data types"},
    {"title": "Control Flow", "order": 2, "course_id": course1.id, "desc": "Master if/else and loops"},
    {"title": "Functions & Scope", "order": 3, "course_id": course1.id, "desc": "Write reusable functions"},
    {"title": "Object-Oriented Programming", "order": 1, "course_id": course2.id, "desc": "Classes and objects"},
    {"title": "Advanced Patterns", "order": 2, "course_id": course2.id, "desc": "Decorators and generators"},
]
modules = []
for m in modules_data:
    module = models.Module(
        title=m["title"], 
        description=m.get("desc", ""),
        order=m["order"], 
        course_id=m["course_id"]
    )
    db.add(module)
    modules.append(module)
db.commit()
for m in modules:
    db.refresh(m)

# ─── Lessons ─────────────────────────────────────────────────────────────────
lessons_data = [
    {"title": "Introduction to Variables", "content": "# Variables\n\nVariables store data:\n\n```python\nx = 5\nname = 'Alice'\n```", "order": 1, "module_id": modules[0].id},
    {"title": "Python Data Types", "content": "# Data Types\n\n- int: `x = 5`\n- str: `name = 'Bob'`\n- list: `nums = [1, 2, 3]`", "order": 2, "module_id": modules[0].id},
    {"title": "If/Else Statements", "content": "# Control Flow\n\n```python\nif x > 0:\n    print('Positive')\nelse:\n    print('Negative')\n```", "order": 1, "module_id": modules[1].id},
    {"title": "For Loops", "content": "# Loops\n\n```python\nfor i in range(5):\n    print(i)\n```", "order": 2, "module_id": modules[1].id},
    {"title": "Defining Functions", "content": "# Functions\n\n```python\ndef greet(name):\n    return f'Hello, {name}'\n```", "order": 1, "module_id": modules[2].id},
    {"title": "Classes Intro", "content": "# OOP\n\n```python\nclass Dog:\n    def bark(self):\n        return 'Woof!'\n```", "order": 1, "module_id": modules[3].id},
]
lessons = []
for l in lessons_data:
    lesson = models.Lesson(title=l["title"], content=l["content"], order=l["order"], module_id=l["module_id"])
    db.add(lesson)
    lessons.append(lesson)
db.commit()
for l in lessons:
    db.refresh(l)

# ─── Tasks (lesson-type) ─────────────────────────────────────────────────────
lesson_tasks = [
    models.Task(
        title="Print Your Name",
        description="Write code that prints your name.",
        difficulty=models.TaskDifficulty.easy,
        task_type=models.TaskType.lesson,
        level="beginner",
        topic="data_types",
        starter_code="# Write your code here\n",
        expected_output="Alice",
        lesson_id=lessons[0].id,
        created_by=teacher1.id,
    ),
    models.Task(
        title="Sum Two Numbers",
        description="Write a function that adds two numbers and prints the result.",
        difficulty=models.TaskDifficulty.easy,
        task_type=models.TaskType.lesson,
        level="beginner",
        topic="functions",
        starter_code="def add(a, b):\n    # your code here\n    pass\n\nprint(add(2, 3))",
        expected_output="5",
        lesson_id=lessons[4].id,
        created_by=teacher1.id,
    ),
]
db.add_all(lesson_tasks)

# ─── Tasks (standalone) ──────────────────────────────────────────────────────
standalone_tasks = [
    # Loops tasks
    models.Task(
        title="Print Numbers 1 to 10",
        description="Use a for loop to print numbers from 1 to 10, each on a new line.",
        difficulty=models.TaskDifficulty.easy,
        task_type=models.TaskType.standalone,
        level="beginner",
        topic="loops",
        starter_code="# Write your code here\n",
        expected_output="1\n2\n3\n4\n5\n6\n7\n8\n9\n10",
        created_by=admin.id,
    ),
    models.Task(
        title="Sum of Range",
        description="Write a function that calculates the sum of all numbers from 1 to n using a loop.",
        difficulty=models.TaskDifficulty.easy,
        task_type=models.TaskType.standalone,
        level="beginner",
        topic="loops",
        starter_code="def sum_range(n):\n    # your code here\n    pass\n\nprint(sum_range(5))",
        expected_output="15",
        created_by=admin.id,
    ),
    models.Task(
        title="Even Numbers Filter",
        description="Given a list, return only the even numbers using a loop.",
        difficulty=models.TaskDifficulty.medium,
        task_type=models.TaskType.standalone,
        level="intermediate",
        topic="loops",
        starter_code="def filter_even(nums):\n    # your code here\n    pass\n\nprint(filter_even([1,2,3,4,5,6]))",
        expected_output="[2, 4, 6]",
        created_by=admin.id,
    ),
    
    # Functions tasks
    models.Task(
        title="Greet Function",
        description="Write a function greet(name) that returns 'Hello, {name}!'.",
        difficulty=models.TaskDifficulty.easy,
        task_type=models.TaskType.standalone,
        level="beginner",
        topic="functions",
        starter_code="def greet(name):\n    # your code here\n    pass\n\nprint(greet('Alice'))",
        expected_output="Hello, Alice!",
        created_by=admin.id,
    ),
    models.Task(
        title="Max of Three",
        description="Write a function that returns the maximum of three numbers.",
        difficulty=models.TaskDifficulty.easy,
        task_type=models.TaskType.standalone,
        level="beginner",
        topic="functions",
        starter_code="def max_of_three(a, b, c):\n    # your code here\n    pass\n\nprint(max_of_three(5, 2, 8))",
        expected_output="8",
        created_by=admin.id,
    ),
    models.Task(
        title="Factorial Function",
        description="Write a recursive or iterative function to calculate n factorial.",
        difficulty=models.TaskDifficulty.medium,
        task_type=models.TaskType.standalone,
        level="intermediate",
        topic="functions",
        starter_code="def factorial(n):\n    # your code here\n    pass\n\nprint(factorial(5))",
        expected_output="120",
        created_by=admin.id,
    ),
    
    # OOP tasks
    models.Task(
        title="Simple Class",
        description="Create a Person class with name attribute and a greet method that returns 'Hi, I am {name}'.",
        difficulty=models.TaskDifficulty.medium,
        task_type=models.TaskType.standalone,
        level="intermediate",
        topic="oop",
        starter_code="class Person:\n    # your code here\n    pass\n\np = Person('Bob')\nprint(p.greet())",
        expected_output="Hi, I am Bob",
        created_by=admin.id,
    ),
    models.Task(
        title="Counter Class",
        description="Create a Counter class with increment() and get_value() methods.",
        difficulty=models.TaskDifficulty.medium,
        task_type=models.TaskType.standalone,
        level="advanced",
        topic="oop",
        starter_code="class Counter:\n    # your code here\n    pass\n\nc = Counter()\nc.increment()\nc.increment()\nprint(c.get_value())",
        expected_output="2",
        created_by=admin.id,
    ),
    
    # Lists/Dicts tasks
    models.Task(
        title="List Reversal",
        description="Reverse a list without using built-in reverse().",
        difficulty=models.TaskDifficulty.easy,
        task_type=models.TaskType.standalone,
        level="beginner",
        topic="lists_dicts",
        starter_code="def reverse_list(lst):\n    # your code here\n    pass\n\nprint(reverse_list([1, 2, 3, 4]))",
        expected_output="[4, 3, 2, 1]",
        created_by=admin.id,
    ),
    models.Task(
        title="Count Occurrences",
        description="Count how many times each element appears in a list. Return a dictionary.",
        difficulty=models.TaskDifficulty.medium,
        task_type=models.TaskType.standalone,
        level="intermediate",
        topic="lists_dicts",
        starter_code="def count_occurrences(lst):\n    # your code here\n    pass\n\nprint(count_occurrences(['a', 'b', 'a', 'c', 'b', 'a']))",
        expected_output="{'a': 3, 'b': 2, 'c': 1}",
        created_by=admin.id,
    ),
    
    # Strings tasks
    models.Task(
        title="Reverse String",
        description="Reverse a string without using slicing [::-1].",
        difficulty=models.TaskDifficulty.easy,
        task_type=models.TaskType.standalone,
        level="beginner",
        topic="strings",
        starter_code="def reverse_string(s):\n    # your code here\n    pass\n\nprint(reverse_string('hello'))",
        expected_output="olleh",
        created_by=admin.id,
    ),
    models.Task(
        title="Palindrome Check",
        description="Check if a string is a palindrome (case-insensitive).",
        difficulty=models.TaskDifficulty.medium,
        task_type=models.TaskType.standalone,
        level="intermediate",
        topic="strings",
        starter_code="def is_palindrome(s):\n    # your code here\n    pass\n\nprint(is_palindrome('Racecar'))",
        expected_output="True",
        created_by=admin.id,
    ),
    
    # Algorithms tasks
    models.Task(
        title="FizzBuzz",
        description="Print numbers 1 to 15. For multiples of 3 print 'Fizz', for 5 print 'Buzz', for both print 'FizzBuzz'.",
        difficulty=models.TaskDifficulty.medium,
        task_type=models.TaskType.standalone,
        level="intermediate",
        topic="algorithms",
        starter_code="# Write your code here\n",
        expected_output="1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
        created_by=admin.id,
    ),
    models.Task(
        title="Binary Search",
        description="Implement binary search. Return the index of target in a sorted list, or -1 if not found.",
        difficulty=models.TaskDifficulty.hard,
        task_type=models.TaskType.standalone,
        level="advanced",
        topic="algorithms",
        starter_code="def binary_search(arr, target):\n    # your code here\n    pass\n\nprint(binary_search([1, 3, 5, 7, 9], 5))",
        expected_output="2",
        created_by=admin.id,
    ),
]
db.add_all(standalone_tasks)
db.commit()

# ─── Groups ──────────────────────────────────────────────────────────────────
groups_data = [
    {"name": "Python Basics - Fall 2025", "code": "fall2025", "teacher": teacher1.id, "course": course1.id},
    {"name": "Advanced Python - Spring 2026", "code": "spring2026", "teacher": teacher2.id, "course": course2.id},
    {"name": "Intro to Programming", "code": "intro101", "teacher": teacher1.id, "course": course1.id},
]
groups = []
for g in groups_data:
    group = models.Group(name=g["name"], invite_code=g["code"], teacher_id=g["teacher"], course_id=g["course"])
    db.add(group)
    groups.append(group)
db.commit()
for g in groups:
    db.refresh(g)

# ─── Enrollments ─────────────────────────────────────────────────────────────
enrollments_data = [
    (students[0].id, groups[0].id),  # Amir -> Fall 2025
    (students[1].id, groups[0].id),  # Aslan -> Fall 2025
    (students[2].id, groups[0].id),  # Almas -> Fall 2025
    (students[2].id, groups[2].id),  # Almas -> Intro 101
    (students[3].id, groups[1].id),  # Dana -> Spring 2026
    (students[4].id, groups[1].id),  # Erlan -> Spring 2026
]
for student_id, group_id in enrollments_data:
    db.add(models.Enrollment(student_id=student_id, group_id=group_id))
db.commit()

# ─── Sample Submissions ──────────────────────────────────────────────────────
# Amir solves a few beginner tasks
db.add(models.Submission(student_id=students[0].id, task_id=standalone_tasks[0].id, code="for i in range(1, 11):\n    print(i)", is_correct=True, score=100.0))
db.add(models.Submission(student_id=students[0].id, task_id=standalone_tasks[3].id, code="def greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('Alice'))", is_correct=True, score=100.0))

# Aslan solves intermediate tasks
db.add(models.Submission(student_id=students[1].id, task_id=standalone_tasks[2].id, code="def filter_even(nums):\n    return [n for n in nums if n % 2 == 0]\n\nprint(filter_even([1,2,3,4,5,6]))", is_correct=True, score=100.0))
db.add(models.Submission(student_id=students[1].id, task_id=standalone_tasks[5].id, code="def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n-1)\n\nprint(factorial(5))", is_correct=True, score=100.0))

# Dana attempts and fails one
db.add(models.Submission(student_id=students[3].id, task_id=standalone_tasks[12].id, code="# incomplete", is_correct=False, score=0.0))
db.commit()

db.close()

print("✅ Seed complete!")
print(f"   Admin:      {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
print(f"   Teacher 1:  teacher@pylearn.com / teacher123")
print(f"   Teacher 2:  marat@pylearn.com / teacher123")
print(f"   Student:    amir@student.com / student123")
print(f"   Groups:     fall2025, spring2026, intro101")
