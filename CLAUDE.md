# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Schola** is an academic platform for IPB (Institut Pertanian Bogor) students to submit and verify academic forms/letters. It is a monorepo with a FastAPI (Python) backend and a React + TypeScript frontend.

---

## Commands

### Backend

```bash
# Setup (from project root or backend/)
pip install -r backend/requirements.txt

# Initialize database
python -m backend.init_db

# Run dev server
uvicorn backend.main:app --reload

# API docs available at
# http://127.0.0.1:8000/docs

# Run all tests
pytest tests/

# Run a single test
pytest tests/test_auth.py::test_register_user
```

### Frontend

```bash
# From frontend/
npm install
npm run dev       # Dev server at http://localhost:5173 (proxies /api to backend)
npm run build
npm run lint
npm run preview
```

---

## Architecture

### Backend: `backend/`

Layered architecture — routers call services, services use models and security utilities.

```
routers/     → HTTP endpoints (auth.py: /auth/register, /auth/login, /auth/me)
services/    → Business logic (auth.py: register_user, authenticate_user)
models/      → SQLAlchemy ORM (user.py: polymorphic User hierarchy)
schemas/     → Pydantic request/response models
security/    → JWT (tokens.py), password hashing (password.py), config (config.py)
dependencies/→ FastAPI dependency injection (auth.py: get_current_user)
database.py  → SQLAlchemy engine, SessionLocal, get_db dependency
```

**User model hierarchy** (single-table-like polymorphism):
- `User` (base): id, email, nama, password_hash, role, created_at
- `Mahasiswa` extends User: nim, fakultas, program_studi
- `OperatorLembaga` extends User: unit_kerja
- `DosenPejabat` extends User: nip, jabatan, unit_kerja

The `role` field is an enum: `mahasiswa`, `dosen_pejabat`, `operator`.

### Frontend: `frontend/src/`

OOP-driven service layer on top of React with Context API for state.

**Data flow:**
```
Page/Component
  → useAuth() hook or direct service call
  → Service singleton (AuthService, SubmissionService, etc.)
  → API client (AuthApi, SubmissionApi, etc.)
  → BaseApiClient (Axios with JWT interceptor)
  → Backend
```

**Key files:**

| File | Role |
|------|------|
| `api/BaseApiClient.ts` | Abstract Axios wrapper; attaches `Authorization: Bearer` header, dispatches `auth:logout` event on 401 |
| `services/AuthService.ts` | Singleton facade; handles auth operations and localStorage via StorageService |
| `contexts/AuthContext.tsx` | React Context holding user state; listens for `auth:logout` events |
| `models/User.ts` | Domain model; factory pattern via `User.fromJSON()`; computed getters: `initials`, `displayRole`, `isMahasiswa`, etc. |
| `router.tsx` | BrowserRouter; public routes (`/`, `/signin`, `/panduan`) and protected `/dashboard/*` routes wrapped in `ProtectedRoute` |
| `components/figma/ui/` | 50+ Shadcn-style UI components |

### Authentication Flow

1. Frontend POST `/auth/login` or `/auth/register`
2. Backend validates credentials, returns JWT
3. Frontend stores token in `localStorage` via `StorageService`
4. `BaseApiClient` interceptor attaches token to every request
5. 401 response → `auth:logout` custom event → `AuthContext` clears user state

### Vite Proxy

In dev, the frontend (`localhost:5173`) proxies requests to the backend (`127.0.0.1:8000`) — configured in `frontend/vite.config.ts`.

---

## Environment Setup

Backend requires a `.env` file in the project root:

```
DATABASE_URL=postgresql://user:password@localhost/schola
SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## What's Not Yet Implemented

The following are defined on the frontend but lack backend routers/models:
- `SubmissionApi.ts` / `SubmissionService.ts` — form submissions
- `TemplateApi.ts` / `TemplateService.ts` — form templates
- `DynamicFormRenderer.tsx` / `FormBuilder.tsx` — dynamic form UI
- Chatbot, Verifikasi pages — no backend support yet

Backend tests are in `tests/test_auth.py` using SQLite in-memory DB with pytest + FastAPI `TestClient`.
