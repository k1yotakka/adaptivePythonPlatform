import psycopg2

conn = psycopg2.connect(host='localhost', user='postgres', password='postgres')
conn.autocommit = True
cur = conn.cursor()
cur.execute("SELECT 1 FROM pg_database WHERE datname='pylearn'")
exists = cur.fetchone()
if not exists:
    cur.execute('CREATE DATABASE pylearn')
    print('Database pylearn created')
else:
    print('Database pylearn already exists')
conn.close()
