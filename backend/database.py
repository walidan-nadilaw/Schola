from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base

from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set.")

engine = create_engine(DATABASE_URL)

try:
    print("SQLAlchemy engine created successfully.")

    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        print("Connection successful. PostgreSQL version:")
        for row in result:
            print(row[0])

except Exception as e:
    print(f"An error occurred: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
