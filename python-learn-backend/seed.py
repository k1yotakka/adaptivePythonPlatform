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
    email="teacher1@codementor.com",
    password_hash=hash_password("teacher123"),
    role=models.UserRole.teacher,
)
teacher2 = models.User(
    name="Marat Nurlan",
    email="teacher2@codementor.com",
    password_hash=hash_password("teacher123"),
    role=models.UserRole.teacher,
)
db.add_all([teacher1, teacher2])

# ─── Students ────────────────────────────────────────────────────────────────
students = [
    models.User(name="Arman Aliakparov", email="arman@student.com", password_hash=hash_password("student123"), role=models.UserRole.student, level="beginner", learning_goal="Learn Python for data science"),
    models.User(name="Eziz Annaev", email="eziz@student.com", password_hash=hash_password("student123"), role=models.UserRole.student, level="intermediate", learning_goal="Improve coding skills"),
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

# ─── Helper: Create Course Structure ─────────────────────────────────────────
def create_course_path(level: str, title: str, description: str, teacher_id: int, is_default: bool, modules_spec: list[dict]):
    course = models.Course(
        title=title,
        description=description,
        teacher_id=teacher_id,
        is_published=True,
        is_default=is_default,
        level=level,
    )
    db.add(course)
    db.flush()

    for module_order, module_spec in enumerate(modules_spec, start=1):
        module = models.Module(
            title=module_spec["title"],
            description=module_spec.get("description", ""),
            order=module_order,
            course_id=course.id,
        )
        db.add(module)
        db.flush()

        for lesson_order, lesson_spec in enumerate(module_spec.get("lessons", []), start=1):
            lesson = models.Lesson(
                title=lesson_spec["title"],
                content=lesson_spec.get("content", ""),
                order=lesson_order,
                module_id=module.id,
            )
            db.add(lesson)
            db.flush()

            for task_spec in lesson_spec.get("tasks", []):
                db.add(models.Task(
                    title=task_spec["title"],
                    description=task_spec["description"],
                    difficulty=task_spec.get("difficulty", models.TaskDifficulty.easy),
                    task_type=models.TaskType.lesson,
                    level=level,
                    topic=task_spec.get("topic"),
                    starter_code=task_spec.get("starter_code"),
                    expected_output=task_spec.get("expected_output"),
                    lesson_id=lesson.id,
                    created_by=teacher_id,
                ))

    db.flush()
    return course


# ─── Default Learning Path: Beginner ─────────────────────────────────────────
beginner_path = create_course_path(
    level="beginner",
    title="Beginner Python Path",
    description="A structured learning path for students who are starting Python from the basics.",
    teacher_id=admin.id,
    is_default=True,
    modules_spec=[
        {
            "title": "Variables and Data Types",
            "description": "Learn how to store and work with simple values in Python.",
            "lessons": [
                {
                    "title": "Variables",
                    "content": "#Variables are used to store values. Example:\n\n```python\nname = 'Alice'\nage = 20\n```",
                    "tasks": [
                        {
                            "title": "Create and Print a Variable",
                            "description": "Create a variable called name with the value 'Alice' and print it.",
                            "topic": "variables",
                            "starter_code": "# create a variable called name and print it\n",
                            "expected_output": "Alice",
                        }
                    ],
                },
                {
                    "title": "Basic Data Types",
                    "content": "#Python has different data types such as strings, integers, floats, and booleans.",
                    "tasks": [
                        {
                            "title": "Print a Data Type",
                            "description": "Print the type of the value 42.",
                            "topic": "data_types",
                            "starter_code": "# print the type of 42\n",
                            "expected_output": "<class 'int'>",
                        }
                    ],
                },
            ],
        },
        {
            "title": "Conditions and Logic",
            "description": "Use if, elif, and else to control program decisions.",
            "lessons": [
                {
                    "title": "If Statements",
                    "content": "Conditions allow a program to make decisions.",
                    "tasks": [
                        {
                            "title": "Positive Number Check",
                            "description": "If x is greater than 0, print 'Positive'.",
                            "topic": "conditionals",
                            "starter_code": "x = 5\n# your code here\n",
                            "expected_output": "Positive",
                        }
                    ],
                }
            ],
        },
        {
            "title": "Loops",
            "description": "Repeat actions using for and while loops.",
            "lessons": [
                {
                    "title": "For Loops",
                    "content": "A for loop repeats code for each item in a sequence.",
                    "tasks": [
                        {
                            "title": "Print Numbers 1 to 3",
                            "description": "Print numbers from 1 to 3, each on a new line.",
                            "topic": "loops",
                            "starter_code": "# your code here\n",
                            "expected_output": "1\n2\n3",
                        }
                    ],
                }
            ],
        },
        {
            "title": "Strings and Lists",
            "description": "Work with text and simple collections.",
            "lessons": [
                {
                    "title": "Strings",
                    "content": "#Strings are used to store text.",
                    "tasks": [
                        {
                            "title": "String Length",
                            "description": "Print the length of the word 'Python'.",
                            "topic": "strings",
                            "starter_code": "word = 'Python'\n# your code here\n",
                            "expected_output": "6",
                        }
                    ],
                },
                {
                    "title": "Lists",
                    "content": "Lists store multiple values in one variable.",
                    "tasks": [
                        {
                            "title": "First List Item",
                            "description": "Print the first item from the list.",
                            "topic": "lists",
                            "starter_code": "items = ['apple', 'banana', 'orange']\n# your code here\n",
                            "expected_output": "apple",
                        }
                    ],
                },
            ],
        },
        {
            "title": "Basic Functions",
            "description": "Create reusable blocks of code using functions.",
            "lessons": [
                {
                    "title": "Defining Functions",
                    "content": "Functions allow you to reuse code.",
                    "tasks": [
                        {
                            "title": "Greeting Function",
                            "description": "Complete the function so it returns 'Hello, Alice!'.",
                            "topic": "functions",
                            "starter_code": "def greet(name):\n    # your code here\n    pass\n\nprint(greet('Alice'))",
                            "expected_output": "Hello, Alice!",
                        }
                    ],
                }
            ],
        },
    ],
)


# ─── Default Learning Path: Intermediate ─────────────────────────────────────
intermediate_path = create_course_path(
    level="intermediate",
    title="Intermediate Python Path",
    description="A structured path for students who already understand Python basics.",
    teacher_id=admin.id,
    is_default=True,
    modules_spec=[
        {
            "title": "String Manipulation",
            "description": "Practice working with text, splitting, joining, and formatting.",
            "lessons": [
                {
                    "title": "Working with Words",
                    "content": "Python strings support methods such as split(), join(), lower(), and replace().",
                    "tasks": [
                        {
                            "title": "Count Words",
                            "description": "Write a function that returns the number of words in a sentence.",
                            "difficulty": models.TaskDifficulty.medium,
                            "topic": "strings",
                            "starter_code": "def count_words(text):\n    # your code here\n    pass\n\nprint(count_words('Python is fun'))",
                            "expected_output": "3",
                        }
                    ],
                }
            ],
        },
        {
            "title": "Lists and Dictionaries",
            "description": "Use collections to store and process structured data.",
            "lessons": [
                {
                    "title": "Dictionaries",
                    "content": "Dictionaries store key-value pairs.",
                    "tasks": [
                        {
                            "title": "Word Frequency",
                            "description": "Count how many times each word appears in a string.",
                            "difficulty": models.TaskDifficulty.medium,
                            "topic": "dictionaries",
                            "starter_code": "def word_frequency(text):\n    # your code here\n    pass\n\nresult = word_frequency('hello world hello')\nprint(result['hello'])",
                            "expected_output": "2",
                        }
                    ],
                }
            ],
        },
        {
            "title": "Debugging",
            "description": "Find and fix common programming errors.",
            "lessons": [
                {
                    "title": "Fixing Loops",
                    "content": "Debugging means finding and fixing mistakes in code.",
                    "tasks": [
                        {
                            "title": "Fix the Index Error",
                            "description": "Fix the code so it prints the sum of [1, 2, 3].",
                            "difficulty": models.TaskDifficulty.medium,
                            "topic": "debugging",
                            "starter_code": "nums = [1, 2, 3]\ntotal = 0\nfor i in range(len(nums)):\n    total += nums[i + 1]\nprint(total)",
                            "expected_output": "6",
                        }
                    ],
                }
            ],
        },
        {
            "title": "Basic Algorithms",
            "description": "Solve common programming problems using loops and functions.",
            "lessons": [
                {
                    "title": "Searching for Values",
                    "content": "Algorithms are step-by-step solutions to problems.",
                    "tasks": [
                        {
                            "title": "Find Maximum Value",
                            "description": "Find the maximum value in a list without using max().",
                            "difficulty": models.TaskDifficulty.medium,
                            "topic": "algorithms",
                            "starter_code": "def find_max(nums):\n    # your code here\n    pass\n\nprint(find_max([3, 5, 1, 9, 2]))",
                            "expected_output": "9",
                        }
                    ],
                }
            ],
        },
    ],
)


# ─── Default Learning Path: Advanced ─────────────────────────────────────────
advanced_path = create_course_path(
    level="advanced",
    title="Advanced Python Path",
    description="A structured path focused on OOP, recursion, and algorithmic problem solving.",
    teacher_id=admin.id,
    is_default=True,
    modules_spec=[
        {
            "title": "Recursion",
            "description": "Solve problems using functions that call themselves.",
            "lessons": [
                {
                    "title": "Recursive Thinking",
                    "content": "Recursion is a technique where a function calls itself.",
                    "tasks": [
                        {
                            "title": "Recursive Factorial",
                            "description": "Write a recursive function that returns n factorial.",
                            "difficulty": models.TaskDifficulty.hard,
                            "topic": "recursion",
                            "starter_code": "def factorial(n):\n    # your code here\n    pass\n\nprint(factorial(5))",
                            "expected_output": "120",
                        }
                    ],
                }
            ],
        },
        {
            "title": "Object-Oriented Programming",
            "description": "Create classes and model real-world objects.",
            "lessons": [
                {
                    "title": "Classes and Methods",
                    "content": "Classes are templates for creating objects.",
                    "tasks": [
                        {
                            "title": "Student Class",
                            "description": "Create a Student class with name, age, and introduce method.",
                            "difficulty": models.TaskDifficulty.hard,
                            "topic": "oop",
                            "starter_code": "class Student:\n    def __init__(self, name, age):\n        pass\n\n    def introduce(self):\n        pass\n\nstudent = Student('Alice', 20)\nprint(student.introduce())",
                            "expected_output": "My name is Alice and I am 20 years old.",
                        }
                    ],
                }
            ],
        },
        {
            "title": "Searching and Sorting",
            "description": "Implement search and sorting algorithms.",
            "lessons": [
                {
                    "title": "Binary Search",
                    "content": "Binary search is used to find values in a sorted list efficiently.",
                    "tasks": [
                        {
                            "title": "Binary Search",
                            "description": "Implement binary search and return the index of the target value.",
                            "difficulty": models.TaskDifficulty.hard,
                            "topic": "sorting_searching",
                            "starter_code": "def binary_search(arr, target):\n    # your code here\n    pass\n\nprint(binary_search([1, 3, 5, 7, 9], 5))",
                            "expected_output": "2",
                        }
                    ],
                }
            ],
        },
        {
            "title": "Advanced Problem Solving",
            "description": "Solve mixed problems using several programming concepts together.",
            "lessons": [
                {
                    "title": "Algorithmic Challenges",
                    "content": "Advanced problems often require combining loops, lists, functions, and logic.",
                    "tasks": [
                        {
                            "title": "Two Sum",
                            "description": "Return indices of two numbers that add up to the target.",
                            "difficulty": models.TaskDifficulty.hard,
                            "topic": "algorithms",
                            "starter_code": "def two_sum(nums, target):\n    # your code here\n    pass\n\nprint(two_sum([2, 7, 11, 15], 9))",
                            "expected_output": "[0, 1]",
                        }
                    ],
                }
            ],
        },
    ],
)

db.commit()


# ─── Standalone Practice Tasks ───────────────────────────────────────────────
standalone_specs = [
    # BEGINNER — variables
    {
        "title": "Print a Variable",
        "description": "Create a variable called name with the value 'Alice' and print it.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "variables",
        "starter_code": "# create a variable called name and print it\n",
        "expected_output": "Alice",
    },
    {
        "title": "Swap Two Variables",
        "description": "Swap the values of variables a and b, then print them.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "variables",
        "starter_code": "a = 5\nb = 10\n# your code here\nprint(a)\nprint(b)",
        "expected_output": "10\n5",
    },

    # BEGINNER — data_types
    {
        "title": "Type of a Value",
        "description": "Print the type of the value 42.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "data_types",
        "starter_code": "# your code here\n",
        "expected_output": "<class 'int'>",
    },
    {
        "title": "Convert String to Integer",
        "description": "Convert the string '25' into an integer and print the result plus 5.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "data_types",
        "starter_code": "value = '25'\n# your code here\n",
        "expected_output": "30",
    },

    # BEGINNER — conditionals
    {
        "title": "Even or Odd",
        "description": "Write a function that returns 'Even' if a number is even, otherwise 'Odd'.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "conditionals",
        "starter_code": "def even_or_odd(n):\n    # your code here\n    pass\n\nprint(even_or_odd(4))",
        "expected_output": "Even",
    },
    {
        "title": "Grade Checker",
        "description": "Return 'Pass' if score is 50 or higher, otherwise return 'Fail'.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "conditionals",
        "starter_code": "def check_grade(score):\n    # your code here\n    pass\n\nprint(check_grade(75))",
        "expected_output": "Pass",
    },

    # BEGINNER — loops
    {
        "title": "Print Numbers 1 to 5",
        "description": "Print numbers from 1 to 5, each on a new line.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "loops",
        "starter_code": "# your code here\n",
        "expected_output": "1\n2\n3\n4\n5",
    },
    {
        "title": "Sum of Numbers",
        "description": "Write a function that returns the sum of numbers from 1 to n.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "loops",
        "starter_code": "def sum_numbers(n):\n    # your code here\n    pass\n\nprint(sum_numbers(5))",
        "expected_output": "15",
    },

    # BEGINNER — strings
    {
        "title": "Reverse String",
        "description": "Reverse a string without using slicing [::-1].",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "strings",
        "starter_code": "def reverse_string(s):\n    # your code here\n    pass\n\nprint(reverse_string('hello'))",
        "expected_output": "olleh",
    },
    {
        "title": "Count Vowels",
        "description": "Count how many vowels are in a string.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "strings",
        "starter_code": "def count_vowels(s):\n    # your code here\n    pass\n\nprint(count_vowels('education'))",
        "expected_output": "5",
    },

    # BEGINNER — lists
    {
        "title": "First and Last Element",
        "description": "Return a list containing the first and last element of the input list.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "lists",
        "starter_code": "def first_last(items):\n    # your code here\n    pass\n\nprint(first_last([10, 20, 30, 40]))",
        "expected_output": "[10, 40]",
    },
    {
        "title": "Find Maximum Value",
        "description": "Find the maximum value in a list without using the built-in max() function.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "lists",
        "starter_code": "def find_max(nums):\n    # your code here\n    pass\n\nprint(find_max([3, 5, 1, 9, 2]))",
        "expected_output": "9",
    },

    # BEGINNER — functions
    {
        "title": "Square Function",
        "description": "Write a function that returns the square of a number.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "functions",
        "starter_code": "def square(n):\n    # your code here\n    pass\n\nprint(square(4))",
        "expected_output": "16",
    },
    {
        "title": "Max of Three",
        "description": "Write a function that returns the maximum of three numbers without using max().",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "functions",
        "starter_code": "def max_of_three(a, b, c):\n    # your code here\n    pass\n\nprint(max_of_three(5, 2, 8))",
        "expected_output": "8",
    },

    # BEGINNER — debugging
    {
        "title": "Debug: Fix the Function",
        "description": "The function should return the square of a number. Fix the bug.",
        "difficulty": models.TaskDifficulty.easy,
        "level": "beginner",
        "topic": "debugging",
        "starter_code": "def square(n):\n    return n + n\n\nprint(square(4))\nprint(square(3))",
        "expected_output": "16\n9",
    },

    # INTERMEDIATE — strings
    {
        "title": "Palindrome Checker",
        "description": "Return True if a string is a palindrome, False otherwise.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "strings",
        "starter_code": "def is_palindrome(s):\n    # your code here\n    pass\n\nprint(is_palindrome('racecar'))\nprint(is_palindrome('hello'))",
        "expected_output": "True\nFalse",
    },
    {
        "title": "Most Frequent Character",
        "description": "Return the most frequent character in a string.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "strings",
        "starter_code": "def most_frequent_char(s):\n    # your code here\n    pass\n\nprint(most_frequent_char('banana'))",
        "expected_output": "a",
    },

    # INTERMEDIATE — lists
    {
        "title": "Remove Duplicates",
        "description": "Return a new list with duplicate values removed while preserving order.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "lists",
        "starter_code": "def remove_duplicates(nums):\n    # your code here\n    pass\n\nprint(remove_duplicates([1, 2, 2, 3, 1, 4]))",
        "expected_output": "[1, 2, 3, 4]",
    },
    {
        "title": "Filter Even Numbers",
        "description": "Return only even numbers from the list.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "lists",
        "starter_code": "def filter_even(nums):\n    # your code here\n    pass\n\nprint(filter_even([1, 2, 3, 4, 5, 6]))",
        "expected_output": "[2, 4, 6]",
    },

    # INTERMEDIATE — dictionaries
    {
        "title": "Word Frequency Counter",
        "description": "Count how many times each word appears in a string.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "dictionaries",
        "starter_code": "def word_frequency(text):\n    # your code here\n    pass\n\nresult = word_frequency('hello world hello')\nprint(result['hello'])\nprint(result['world'])",
        "expected_output": "2\n1",
    },
    {
        "title": "Merge Dictionaries",
        "description": "Merge two dictionaries. If a key exists in both, add their values.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "dictionaries",
        "starter_code": "def merge_counts(a, b):\n    # your code here\n    pass\n\nprint(merge_counts({'a': 2, 'b': 1}, {'a': 3, 'c': 4}))",
        "expected_output": "{'a': 5, 'b': 1, 'c': 4}",
    },

    # INTERMEDIATE — sets
    {
        "title": "Common Elements",
        "description": "Return a set of elements that appear in both lists.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "sets",
        "starter_code": "def common_elements(a, b):\n    # your code here\n    pass\n\nprint(common_elements([1, 2, 3], [2, 3, 4]))",
        "expected_output": "{2, 3}",
    },

    # INTERMEDIATE — functions
    {
        "title": "Factorial Function",
        "description": "Write a function that returns factorial of n.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "functions",
        "starter_code": "def factorial(n):\n    # your code here\n    pass\n\nprint(factorial(5))",
        "expected_output": "120",
    },

    # INTERMEDIATE — debugging
    {
        "title": "Debug: Fix the Loop",
        "description": "Fix the code so it sums all numbers in the list [1, 2, 3].",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "debugging",
        "starter_code": "nums = [1, 2, 3]\ntotal = 0\nfor i in range(len(nums)):\n    total += nums[i + 1]\nprint(total)",
        "expected_output": "6",
    },

    # INTERMEDIATE — oop
    {
        "title": "Basic Class",
        "description": "Create a Person class with a greet method.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "oop",
        "starter_code": "class Person:\n    # your code here\n    pass\n\np = Person('Bob')\nprint(p.greet())",
        "expected_output": "Hi, I am Bob",
    },

    # INTERMEDIATE — algorithms
    {
        "title": "FizzBuzz",
        "description": "Print numbers from 1 to 15. For multiples of 3 print Fizz, for multiples of 5 print Buzz, and for both print FizzBuzz.",
        "difficulty": models.TaskDifficulty.medium,
        "level": "intermediate",
        "topic": "algorithms",
        "starter_code": "# your code here\n",
        "expected_output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
    },

    # ADVANCED — recursion
    {
        "title": "Recursive Fibonacci",
        "description": "Write a recursive function that returns the nth Fibonacci number.",
        "difficulty": models.TaskDifficulty.hard,
        "level": "advanced",
        "topic": "recursion",
        "starter_code": "def fibonacci(n):\n    # your code here\n    pass\n\nprint(fibonacci(6))",
        "expected_output": "8",
    },
    {
        "title": "Recursive Sum",
        "description": "Write a recursive function that returns the sum of a list.",
        "difficulty": models.TaskDifficulty.hard,
        "level": "advanced",
        "topic": "recursion",
        "starter_code": "def recursive_sum(nums):\n    # your code here\n    pass\n\nprint(recursive_sum([1, 2, 3, 4]))",
        "expected_output": "10",
    },

    # ADVANCED — oop
    {
        "title": "Student Class",
        "description": "Create a Student class with name, age, and introduce method.",
        "difficulty": models.TaskDifficulty.hard,
        "level": "advanced",
        "topic": "oop",
        "starter_code": "class Student:\n    def __init__(self, name, age):\n        # store name and age\n        pass\n\n    def introduce(self):\n        # return introduction string\n        pass\n\nstudent = Student('Alice', 20)\nprint(student.introduce())",
        "expected_output": "My name is Alice and I am 20 years old.",
    },
    {
        "title": "Bank Account",
        "description": "Create a BankAccount class with deposit, withdraw, and get_balance methods.",
        "difficulty": models.TaskDifficulty.hard,
        "level": "advanced",
        "topic": "oop",
        "starter_code": "class BankAccount:\n    # your code here\n    pass\n\naccount = BankAccount(100)\naccount.deposit(50)\naccount.withdraw(30)\nprint(account.get_balance())",
        "expected_output": "120",
    },

    # ADVANCED — algorithms
    {
        "title": "Two Sum",
        "description": "Return indices of two numbers that add up to the target.",
        "difficulty": models.TaskDifficulty.hard,
        "level": "advanced",
        "topic": "algorithms",
        "starter_code": "def two_sum(nums, target):\n    # your code here\n    pass\n\nprint(two_sum([2, 7, 11, 15], 9))",
        "expected_output": "[0, 1]",
    },
    {
        "title": "Valid Parentheses",
        "description": "Return True if the string has valid parentheses order.",
        "difficulty": models.TaskDifficulty.hard,
        "level": "advanced",
        "topic": "algorithms",
        "starter_code": "def is_valid_parentheses(s):\n    # your code here\n    pass\n\nprint(is_valid_parentheses('({[]})'))\nprint(is_valid_parentheses('([)]'))",
        "expected_output": "True\nFalse",
    },

    # ADVANCED — sorting_searching
    {
        "title": "Binary Search",
        "description": "Implement binary search. Return the index of target in a sorted list, or -1 if not found.",
        "difficulty": models.TaskDifficulty.hard,
        "level": "advanced",
        "topic": "sorting_searching",
        "starter_code": "def binary_search(arr, target):\n    # your code here\n    pass\n\nprint(binary_search([1, 3, 5, 7, 9], 5))",
        "expected_output": "2",
    },
    {
        "title": "Bubble Sort",
        "description": "Implement bubble sort and return the sorted list.",
        "difficulty": models.TaskDifficulty.hard,
        "level": "advanced",
        "topic": "sorting_searching",
        "starter_code": "def bubble_sort(nums):\n    # your code here\n    pass\n\nprint(bubble_sort([5, 1, 4, 2, 8]))",
        "expected_output": "[1, 2, 4, 5, 8]",
    },

    # ADVANCED — debugging
    {
        "title": "Debug: Recursive Function",
        "description": "Fix the recursive factorial function so it returns 120 for factorial(5).",
        "difficulty": models.TaskDifficulty.hard,
        "level": "advanced",
        "topic": "debugging",
        "starter_code": "def factorial(n):\n    if n == 0:\n        return 0\n    return n * factorial(n - 1)\n\nprint(factorial(5))",
        "expected_output": "120",
    },
]

standalone_tasks = []
for spec in standalone_specs:
    task = models.Task(
        title=spec["title"],
        description=spec["description"],
        difficulty=spec["difficulty"],
        task_type=models.TaskType.standalone,
        level=spec["level"],
        topic=spec["topic"],
        starter_code=spec["starter_code"],
        expected_output=spec["expected_output"],
        created_by=admin.id,
    )
    db.add(task)
    standalone_tasks.append(task)

db.commit()
for task in standalone_tasks:
    db.refresh(task)

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
    (students[0].id, groups[0].id),
    (students[1].id, groups[0].id),
    (students[2].id, groups[0].id),
    (students[2].id, groups[2].id),
    (students[3].id, groups[1].id),
    (students[4].id, groups[1].id),
]
for student_id, group_id in enrollments_data:
    db.add(models.Enrollment(student_id=student_id, group_id=group_id))
db.commit()

# ─── Sample Submissions ──────────────────────────────────────────────────────
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
print(f"   Student:    arman@student.com / student123")
print(f"   Groups:     fall2025, spring2026, intro101")
