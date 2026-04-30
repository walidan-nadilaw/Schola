from backend.database import Base, engine


def init_db():
    """Create all database tables defined in the SQLAlchemy models.

    This function should be invoked explicitly when you want to initialise or reset
    the database schema. It is not executed automatically on import to avoid side
    effects during normal application startup.
    """
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    init_db()
