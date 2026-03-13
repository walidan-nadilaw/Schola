from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from dotenv import load_dotenv
import os

try:
    DATABASE_URL = str(os.getenv("DATABASE_URL"))
    engine = create_engine(DATABASE_URL)

    print("SQLAlchemy engine created successfully.")

    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        print("Connection successful. PostgreSQL version:")
        for row in result:
            print(row[0])

except Exception as e:
    print(f"An error occurred: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
