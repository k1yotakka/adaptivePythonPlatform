"""
Drop all tables and reseed the database.
Run: python reseed.py
"""
from app.database import SessionLocal, engine, Base
from app import models

print("⚠️  Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("✅ Creating fresh tables...")
Base.metadata.create_all(bind=engine)

print("🌱 Running seed script...")
import seed

print("\n✅ Reseed complete!")
