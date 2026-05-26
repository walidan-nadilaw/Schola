# Schola

Platform academic helper untuk sivitas IPB untuk projek Analisis Desain Sistem Kelompok 1.

Schola is a modern, clean-architecture academic document management and workflow platform tailored for the IPB University community. It automates form templates, document submissions, and multi-stage verifications.

---

## Project Structure

The project is structured as a monorepo with distinct backend and frontend applications:

```
Schola/
├── backend/                  # FastAPI + SQLAlchemy async + PostgreSQL + Alembic API
├── frontend/                 # Frontend Application (React / Next.js)
└── docker-compose.yml        # Dev/prod orchestration for all services
```

---

## Quick Start

### 1. Backend (API & Database)

The backend features a fully async FastAPI web server using Clean Architecture with vertical slicing.

- **Documentation & Guide:** Refer to the comprehensive [Backend README](file:///c:/Users/LENOVO/Documents/Projects/Schola/backend/README.md) for local installation, environment configuration, database migration, and API details.
- **Database & Migrations:** Powered by **PostgreSQL 16** with schema migrations managed by **Alembic**.
- **Quick Launch (Docker Compose):**

  ```bash
  # From the repository root
  docker compose up --build -d
  ```

  This will spin up the database and the API with automated migrations already applied. The interactive Swagger API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend

* **Documentation & Guide:** Refer to [Frontend Directory](file:///c:/Users/LENOVO/Documents/Projects/Schola/frontend/) for setup and run instructions.

---

## Tech Stack Highlights

- **Backend**: FastAPI, SQLAlchemy (Async), PostgreSQL, Alembic, PyJWT, Argon2, Poetry.
- **Testing**: 71 tests across 9 feature slices with transactional isolation.
- **Deployment**: Docker, Docker Compose.

---

## Key Project Documentation

- **Feature Roadmap & Status:** [PLAN.md](file:///c:/Users/LENOVO/Documents/Projects/Schola/backend/PLAN.md)
- **Architecture & Design Patterns:** [ARCHITECTURE.md](file:///c:/Users/LENOVO/Documents/Projects/Schola/backend/ARCHITECTURE.md)
