from backend.database import Base, engine
from backend.models.user import User, Mahasiswa, OperatorLembaga, DosenPejabat

Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")