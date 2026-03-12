from typing import Optional, List

from fastapi import FastAPI, HTTPException, Path, status, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI(title="Integration with SQL - Beginner Friendly")

# Database Setup

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

SessionLocal = sessionmaker(autocommit = False, autoflush=False, bind=engine)

Base = declarative_base()

#Database Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    role = Column(String(100), nullable=False)

Base.metadata.create_all(engine)

#Pydantic Models (dataclasses)
class UserCreate(BaseModel):
    name:str
    email:str
    role:str

class UserResponse(BaseModel):
    id:int
    name:str
    email:str
    role:str

    class Config:
        from_attributes = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

get_db()
@app.get("/")
def root():
    return {"message": "Halo SQLAlchemy!"}

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id:int, db:Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db:Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=409, detail="User already exists.")
    
    # Create
    new_user = User(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# update user
@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id:int, user:UserCreate, db:Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    for field, value in user.model_dump().items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


# delete user
@app.delete("/users/{user_id}")
def delete_user(user_id: int, db:Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User Deleted.", "deleted_user": db_user}

# get all users
@app.get("/users/", response_model=List[UserResponse])
def get_all_users(db:Session = Depends(get_db)):
    return db.query(User).all()
