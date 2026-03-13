from fastapi import FastAPI
from database import Base, engine
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Schola API")
