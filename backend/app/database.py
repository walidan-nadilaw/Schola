from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# In the future, we can configure async connection engine if needed.
# For standard psycopg2-binary, we use standard sync engine with connection pool.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    FastAPI Dependency to get database session.
    Automatically closes session at the end of request lifetime.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
