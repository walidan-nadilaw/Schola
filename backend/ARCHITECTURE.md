# Schola Backend — Architecture Guide

## Overview

This project uses **Clean Architecture** with **Vertical Slicing** for feature organization. The core principle is that business logic (domain) has zero dependency on frameworks (FastAPI, SQLAlchemy). Dependencies always point inward.

```
src/
├── core/                  # Framework-agnostic shared utilities
│   ├── config.py          # Environment / settings
│   └── time_now.py        # UTC timestamp helper
│
├── domain/                # Business entities & repository contracts
│   └── entity/
│       ├── user.py        # Domain dataclass
│       └── i_user_repository.py  # Abstract interface (port)
│
├── application/           # Service interface contracts (ports)
│   ├── i_password_service.py
│   ├── i_token_service.py
│   ├── i_email_service.py
│   └── i_storage_service.py
│
├── infrastructure/        # Framework implementations (adapters)
│   ├── db.py              # SQLAlchemy engine & session
│   ├── models/            # ORM models (with to_domain / from_domain)
│   ├── repositories/      # Concrete repository implementations
│   ├── services/          # Concrete service implementations
│   └── migrations/        # Alembic migrations
│
├── api/                   # Shared API layer (cross-cutting)
│   ├── exceptions.py      # HTTP exception classes
│   ├── error_handler.py   # Global exception handlers
│   ├── http.py            # Generic response schemas
│   └── deps/
│       └── auth.py        # get_current_user, require_role
│
├── features/              # Vertical feature slices
│   └── auth/
│       ├── schemas.py     # Pydantic request/response models
│       ├── use_case.py    # Business logic
│       └── router.py      # FastAPI endpoints
│
└── app.py                 # Entrypoint — mounts routers & middleware
```

---

## Layers & Dependency Rule

```
    ┌──────────────────────────┐
    │       Domain Layer       │  ← Innermost, no dependencies
    │  Entities, Interfaces    │
    └────────────▲─────────────┘
                 │
    ┌────────────┴─────────────┐
    │    Application Layer     │  ← Service port interfaces
    │  IPasswordService, etc.  │
    └────────────▲─────────────┘
                 │
    ┌────────────┴─────────────┐
    │  Infrastructure Layer    │  ← Implements ports
    │  SQLAlchemy, PyJWT, etc. │
    └────────────▲─────────────┘
                 │
    ┌────────────┴─────────────┐
    │     Features Layer       │  ← Wires everything together
    │  Schemas, UseCases,      │
    │  Routers                 │
    └──────────────────────────┘
```

**The rule**: each layer may only depend on layers above it (more inward). Domain never imports from infrastructure. Use cases depend on interfaces, never on concrete classes.

---

## Design Patterns

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Repository** | `IUserRepository` → `UserRepository` | Abstract DB access behind an interface |
| **Ports & Adapters** | `IPasswordService` → `ArgonPasswordService` | Domain defines what it needs, infra provides how |
| **Use Case / Interactor** | `RegisterUseCase` | One class, one business operation, one `execute()` |
| **Data Mapper** | `to_domain()` / `from_domain()` on ORM models | Bridge between SQLAlchemy and domain dataclasses |
| **Dependency Injection** | Router creates and injects deps into use cases | Keeps use cases testable and decoupled |
| **Factory Method** | `User.New(...)` | Domain entity controls its own creation with built-in validation |
| **Vertical Slice** | `src/features/<name>/` | Each feature owns its schemas, logic, and routes |

---

## How to Add a New Feature

Example: adding a **Submissions** feature.

### Step 1 — Domain Entity (if new)

If you need a new entity, create it in `src/domain/entity/`:

```python
# src/domain/entity/submission.py
@dataclass
class Submission:
    id: str
    submitter_id: UUID
    letter_type: str
    status: SubmissionStatus
    ...

    @classmethod
    def New(cls, ...) -> Self:
        """Factory with domain validation."""
```

### Step 2 — Repository Interface (if new)

Define what persistence operations the domain needs:

```python
# src/domain/entity/i_submission_repository.py
class ISubmissionRepository(IRepository[Submission, str]):
    @abstractmethod
    async def find_by_submitter_id(self, submitter_id: UUID) -> Iterable[Submission]:
        ...
```

### Step 3 — Infrastructure Model (if new)

Create the ORM model with bidirectional mapping:

```python
# src/infrastructure/models/submission.py
class Submission(Base):
    __tablename__ = "submissions"
    ...

    def to_domain(self) -> DomainSubmission:
        ...

    @classmethod
    def from_domain(cls, entity: DomainSubmission) -> "Submission":
        ...
```

Then run: `alembic revision --autogenerate -m "Add submissions table"` and `alembic upgrade head`.

### Step 4 — Concrete Repository (if new)

Implement the interface:

```python
# src/infrastructure/repositories/submission_repository.py
class SubmissionRepository(ISubmissionRepository):
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def find_by_submitter_id(self, submitter_id: UUID) -> Iterable[Submission]:
        ...
```

### Step 5 — Feature Slice

Create the vertical slice:

```
src/features/submissions/
├── __init__.py
├── schemas.py       # Request/response Pydantic models
├── use_case.py      # Business logic
└── router.py        # FastAPI endpoints
```

**schemas.py** — define request/response models:
```python
class CreateSubmissionRequest(BaseModel):
    template_id: str
    form_data: dict[str, Any]

class SubmissionResponse(BaseModel):
    id: str
    letter_type: str
    status: str
    ...
```

**use_case.py** — business logic with injected interfaces:
```python
class CreateSubmissionUseCase:
    def __init__(
        self,
        submission_repo: ISubmissionRepository,
        template_repo: IFormTemplateRepository,
    ) -> None:
        self._submission_repo = submission_repo
        self._template_repo = template_repo

    async def execute(self, submitter: User, ...) -> Submission:
        # 1. Validate template exists
        # 2. Create domain entity
        # 3. Persist and return
```

**router.py** — thin adapter, wires concrete deps:
```python
router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.post("/", status_code=201)
async def create_submission(
    body: CreateSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    use_case = CreateSubmissionUseCase(
        submission_repo=SubmissionRepository(db),
        template_repo=FormTemplateRepository(db),
    )
    submission = await use_case.execute(submitter=current_user, ...)
    return HTTPDataResponse(status="success", data=..., message="...")
```

### Step 6 — Mount the Router

Add one line in `src/app.py`:

```python
from src.features.submissions.router import router as submissions_router
app.include_router(submissions_router)
```

### Step 7 — Verify

```bash
# Compile check
py -m py_compile src/features/submissions/schemas.py
py -m py_compile src/features/submissions/use_case.py
py -m py_compile src/features/submissions/router.py

# Run the server and test via /docs
uvicorn src.app:app --reload
```

---

## Conventions

- **Domain entities** are plain `@dataclass` classes — no ORM, no Pydantic.
- **ORM models** always provide `to_domain()` and `from_domain()` mappers.
- **Use cases** receive interfaces via constructor — never import concrete implementations.
- **Routers** are the only place where concrete implementations are instantiated.
- **Timestamps** use `src.core.time_now.now` — single source of truth for UTC time.
- **Error messages** are in Indonesian (Bahasa) for user-facing strings.
- **Response format** uses `HTTPDataResponse` / `HTTPMessageResponse` from `src.api.http`.
