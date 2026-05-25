# Schola Backend

REST API for the Schola academic document platform, built for sivitas IPB.  
Built with **FastAPI** · **SQLAlchemy (async)** · **PostgreSQL** · **Alembic** · **Clean Architecture**

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Database & Migrations](#database--migrations)
- [Running the Server](#running-the-server)
- [API Docs](#api-docs)
- [Architecture](#architecture)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.128 |
| Validation | Pydantic v2 |
| ORM | SQLAlchemy 2.0 (async) |
| DB Driver | asyncpg + psycopg2-binary |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Auth | PyJWT (HS256) |
| Server | Uvicorn |
| Python | 3.10+ |

---

## Project Structure

```
backend/
├── src/
│   ├── app.py                  # FastAPI app factory — mounts all routers
│   ├── core/
│   │   ├── config.py           # Settings loaded from environment variables
│   │   ├── rate_limiter.py     # Rate limiting setup
│   │   └── time_now.py         # Shared UTC timestamp helper
│   ├── domain/                 # Business entities & repository interfaces (no framework deps)
│   ├── application/            # Service port interfaces (e.g. IPasswordService)
│   ├── infrastructure/
│   │   ├── db.py               # Async engine & session factory
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── repositories/       # Concrete repository implementations
│   │   ├── services/           # Concrete service implementations (JWT, storage, etc.)
│   │   └── migrations/         # Alembic migration scripts
│   │       └── versions/
│   ├── api/
│   │   ├── deps/auth.py        # get_current_user, require_role FastAPI dependencies
│   │   ├── error_handler.py    # Global exception → HTTP response mapping
│   │   ├── exceptions.py       # Custom HTTP exception classes
│   │   └── http.py             # Shared response schemas
│   └── features/               # Vertical feature slices
│       ├── auth/               # Register, login, refresh
│       └── users/              # User profile management
├── alembic.ini
├── Dockerfile
├── .dockerignore
├── pyproject.toml
└── requirements.txt
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **PostgreSQL 16** running locally (or via Docker)
- **pip** or **Poetry**

---

### Local Setup

**1. Clone and enter the backend directory**

```bash
cd backend
```

**2. Create a virtual environment and install dependencies**

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your local values — see [Environment Variables](#environment-variables) for all keys.

**4. Run database migrations**

```bash
python -m alembic upgrade head
```

**5. Start the development server**

```bash
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

The API is now live at **http://localhost:8000**.

---

### Docker Setup

The easiest way to run the full stack (API + PostgreSQL) is via Docker Compose from the **repo root**:

```bash
# From the project root (one level above backend/)
docker compose up --build -d
```

This will:
1. Start a PostgreSQL 16 container with a persistent named volume
2. Build and start the API container
3. Automatically run `alembic upgrade head` before the server starts

**Common commands:**

```bash
# View API logs
docker compose logs -f api

# Stop all containers
docker compose down

# Stop and wipe the database volume
docker compose down -v

# Rebuild after code changes
docker compose up --build -d
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. **Required** variables will cause the app to crash on startup if missing.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | ✅ | — | PostgreSQL host (use `db` inside Docker) |
| `DB_PORT` | ✅ | — | PostgreSQL port (typically `5432`) |
| `DB_USER` | ✅ | — | PostgreSQL username |
| `DB_PASSWORD` | ✅ | — | PostgreSQL password |
| `DB_NAME` | ✅ | — | Database name |
| `JWT_SECRET_KEY` | ✅ | — | Secret key for signing JWTs (min 32 chars) |
| `JWT_EXPIRE_MINUTES` | ✅ | — | JWT expiry in minutes (1–1440) |
| `JWT_ALGORITHM` | ❌ | `HS256` | JWT signing algorithm |
| `EMAIL_SALT` | ✅ | — | Salt for email-based token hashing |
| `APP_ENV` | ❌ | `development` | `development` or `production` |
| `BASE_URL` | ❌ | — | Public API base URL |
| `FRONTEND_BASE_URL` | ❌ | — | Frontend origin URL (for CORS) |
| `SMTP_HOST` | ❌ | — | SMTP server host |
| `SMTP_PORT` | ❌ | `587` | SMTP server port |
| `SMTP_USER` | ❌ | — | SMTP username |
| `SMTP_PASSWORD` | ❌ | — | SMTP password |
| `SMTP_FROM_EMAIL` | ❌ | `noreply@apps.ipb.ac.id` | Sender address for outgoing emails |
| `R2_ACCOUNT_ID` | ❌ | — | Cloudflare R2 account ID |
| `R2_ACCESS_KEY` | ❌ | — | R2 access key |
| `R2_SECRET_KEY` | ❌ | — | R2 secret key |
| `R2_BUCKET_NAME` | ❌ | — | R2 bucket name |
| `R2_PUBLIC_URL` | ❌ | — | Public URL for R2 assets |
| `FACTORY_STORAGE_TYPE` | ❌ | — | Set to `r2` to enable R2 storage |

---

## Database & Migrations

This project uses **Alembic** for schema migrations. All commands should be run from the `backend/` directory.

```bash
# Check current migration state
python -m alembic current

# Apply all pending migrations
python -m alembic upgrade head

# Roll back one migration
python -m alembic downgrade -1

# Autogenerate a new migration after model changes
python -m alembic revision --autogenerate -m "Add my_table"

# View migration history
python -m alembic history
```

> **Tip**: The migration environment reads `DATABASE_URL` directly from your `.env` via `src.core.config`. No need to set `sqlalchemy.url` in `alembic.ini`.

### Current Tables

| Table | Description |
|---|---|
| `users` | User accounts (mahasiswa, operator, dosen/pejabat) |
| `faqs` | Frequently asked questions |
| `form_templates` | Letter/document templates with dynamic field definitions |
| `submissions` | Student document submission requests |
| `submission_verifiers` | Per-submission verifier chain with ordered signing |
| `activity_logs` | Audit trail for all significant actions |
| `attachments` | Files uploaded alongside submissions |
| `notifications` | In-app notifications for users |

---

## Running the Server

**Development** (with hot reload):

```bash
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

**Production** (multi-worker):

```bash
uvicorn src.app:app --host 0.0.0.0 --port 8000 --workers 4
```

Or via Docker — see [Docker Setup](#docker-setup).

---

## API Docs

When the server is running, interactive docs are available at:

| UI | URL |
|---|---|
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| OpenAPI JSON | http://localhost:8000/openapi.json |

### Available Endpoints

| Prefix | Feature |
|---|---|
| `/auth` | Register, login, token refresh |
| `/users` | User profile read/update |

---

## Architecture

This backend follows **Clean Architecture** with **Vertical Slicing**. The core principle: business logic has zero dependency on frameworks.

```
Domain → Application → Infrastructure → Features (API)
```

- **Domain** — plain Python dataclasses, repository interfaces. No FastAPI, no SQLAlchemy.
- **Application** — abstract service interfaces (`IPasswordService`, `ITokenService`, etc.).
- **Infrastructure** — concrete implementations (SQLAlchemy repos, PyJWT service, asyncpg).
- **Features** — vertical slices that wire everything together (schemas → use case → router).

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for a full breakdown, design patterns used, and a step-by-step guide for adding new features.
