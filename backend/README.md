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
│       ├── auth/               # Register, login, logout, profile
│       ├── users/              # User management CRUD (admin/operator)
│       ├── templates/          # Document templates CRUD
│       ├── submissions/        # Document submission lifecycle (draft, finalize)
│       ├── verification/       # Verifier pipeline with HMAC e-signature
│       ├── files/              # File upload, download & delete (PDF, images, ZIP)
│       ├── notifications/      # In-app notification feed
│       ├── dashboard/          # Role-aware stats & activity
│       └── faqs/               # Public FAQ (CRUD operator-only)
├── alembic.ini
├── Dockerfile
├── .dockerignore
├── pyproject.toml
└── requirements.txt
```

---

## Getting Started

### Prerequisites

- **Python 3.10+** & **Poetry** (or pip)
- **PostgreSQL 16** (via Docker or local install)

---

### Option A: Docker (full stack, zero local deps)

From the **repo root**, one command:

```bash
docker compose up --build -d
```

This starts PostgreSQL + API, runs migrations, and seeds demo data. API at <http://localhost:8000>.

```bash
docker compose logs -f api    # tail logs
docker compose down           # stop
docker compose down -v        # stop + wipe DB
docker compose up --build -d  # rebuild after changes
```

Demo accounts: `admin@ipb.ac.id` / `admin123`, `user1@apps.ipb.ac.id` / `user123`, etc.

---

### Option B: Local dev (hot reload, Poetry)

**1. Start PostgreSQL via Docker (db only)**

```bash
# From the repo root
docker compose up -d db
```

**2. Install dependencies**

```bash
cd backend
poetry install
```

**3. Configure environment**

```bash
cp .env.example .env
```

The defaults in `.env.example` match the Docker DB. Change secrets for production.

**4. Run migrations**

```bash
poetry run alembic upgrade head
```

**5. Start dev server (hot reload)**

```bash
poetry run uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

API at <http://localhost:8000>, docs at <http://localhost:8000/docs>.

**6. Run tests**

```bash
poetry run pytest                          # all 71 tests
poetry run pytest tests/e2e                # end-to-end flow only
poetry run pytest -k "test_register"       # single test
```

Tests use a real PostgreSQL (same DB as local dev) with `NullPool` for isolation. Tables are created once and truncated between tests.

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
| `MAX_FILE_SIZE_BYTES` | ❌ | `10485760` | Max upload file size in bytes (default 10 MB) |
| `ALLOWED_MIME_TYPES` | ❌ | `application/pdf,image/jpeg,image/png,application/zip` | Comma-separated allowed MIME types |

---

## Database & Migrations

This project uses **Alembic** for schema migrations. Run all commands from `backend/` with `poetry run`:

```bash
poetry run alembic current                    # check current state
poetry run alembic upgrade head               # apply all pending
poetry run alembic downgrade -1               # roll back one
poetry run alembic revision --autogenerate -m "Add my_table"  # generate
poetry run alembic history                    # view history
```

> The migration env reads `DATABASE_URL` from `src.core.config` (your `.env` file). No need to edit `alembic.ini`.

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

```bash
# Development (hot reload)
poetry run uvicorn src.app:app --reload --host 0.0.0.0 --port 8000

# Production (multi-worker)
poetry run uvicorn src.app:app --host 0.0.0.0 --port 8000 --workers 4
```

Or via Docker — see [Option A](#option-a-docker-full-stack-zero-local-deps).

---

## API Docs

When the server is running, interactive docs are available at:

| UI | URL |
|---|---|
| Swagger UI | <http://localhost:8000/docs> |
| ReDoc | <http://localhost:8000/redoc> |
| OpenAPI JSON | <http://localhost:8000/openapi.json> |

### Available Endpoints

| Prefix | Feature | Description | Auth Roles |
|---|---|---|---|
| `/auth` | Authentication | Register, login, logout, me profile | Public / Authenticated |
| `/users` | Users Management | List (with search/filter), get, create, update, and soft-delete users | Authenticated (Read) / Operator+ (Write) |
| `/templates` | Form Templates | Create, update, soft-delete, list and get form templates | Public (Read) / Operator+ (Write) |
| `/submissions` | Submissions | Draft creation, submit with verifier assignment + form validation, CRUD | Mahasiswa (Create/Update) / Authenticated (List/Detail) |
| `/verifications` | Verification | Verifier pipeline: list pending, approve/reject with HMAC e-signature | Dosen/Pejabat |
| `/files` | File Attachments | Upload, download, and delete supporting documents (R2 or local) | Authenticated |
| `/notifications` | Notifications | List and mark notifications as read | Authenticated |
| `/dashboard` | Dashboard | Role-aware submission counts & recent activity | Authenticated |
| `/faqs` | FAQs | List, get (public); create, update, delete (operator) | Public / Operator |

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
