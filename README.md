# Quick Start Guide for Schola Backend

## Prerequisites
- **Python 3.10+**
- **Poetry** or **pip** for dependency management (the project uses a `requirements.txt`).
- **PostgreSQL** (or any SQLAlchemy‑compatible DB) running locally.

## 1. Install dependencies
```bash
# Using pip
pip install -r requirements.txt
```
If you prefer Poetry:
```bash
poetry install
```

## 2. Configure environment variables
Create a `.env` file in the project root (or export variables) with at least the following keys:
```
DATABASE_URL=postgresql://user:password@localhost:5432/schola
SECRET_KEY=your-very-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```
Adjust the values to match your local database setup.

## 3. Initialise the database
Run the helper script to create all tables:
```bash
python -m backend.init_db
```
You should see `Database tables created successfully!`.

## 4. Run the development server
```bash
uvicorn backend.main:app --reload
```
The API will be available at `http://127.0.0.1:8000`. You can explore the interactive Swagger UI at `http://127.0.0.1:8000/docs`.

## 5. Quick sanity check
- Open the Swagger UI and try the **/auth/register** and **/auth/login** endpoints.
- Use the **/auth/me** endpoint with the returned JWT token to verify the authentication dependency works.

---
*Feel free to extend this README with deployment instructions, testing commands, or CI/CD setup as the project evolves.*
