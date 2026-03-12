import os
import sys

# Force UTF-8 encoding before psycopg2 loads
os.environ['PYTHONUTF8'] = '1'
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['PGCLIENTENCODING'] = 'UTF8'

# Set locale to avoid encoding issues
import locale
try:
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'C.UTF-8')
    except:
        pass

# Now run the actual seed script
exec(open('seed.py', encoding='utf-8').read())
