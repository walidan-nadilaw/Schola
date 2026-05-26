# Schola Backend - Feature Roadmap

Features implemented from the [.ancient](file:///c:/Users/LENOVO/Documents/Projects/Schola/backend/.ancient/app/routers) codebase. Each feature follows the vertical slicing pattern described in [ARCHITECTURE.md](file:///c:/Users/LENOVO/Documents/Projects/Schola/backend/ARCHITECTURE.md).

---

## Completed

### 1. Auth (`src/features/auth/`)

- `POST /auth/register` - Register new user (IPB email only)
- `POST /auth/login` - Login, receive JWT
- `POST /auth/logout` - Stateless logout
- `GET  /auth/me` - Get current user profile

### 2. Users Management (`src/features/users/`)

Operator-only CRUD for managing users.

- `GET /users` - List/search users (paginated, filterable by role/department)
- `GET /users/{id}` - Get single user profile
- `POST /users` - Create user (operator bypass, email_verified=true)
- `PUT /users/{id}` - Update user attributes
- `DELETE /users/{id}` - Soft-delete (is_active=false)

### 3. Form Templates (`src/features/templates/`)

Dynamic letter form templates with JSON schema fields.

- `GET /templates` - List active templates
- `GET /templates/{id}` - Get single template
- `POST /templates` - Create template (Operator only)
- `PUT /templates/{id}` - Update template (Operator only)
- `DELETE /templates/{id}` - Soft-delete (is_active=false, Operator only)

### 4. Submissions (`src/features/submissions/`)

Core letter request lifecycle: draft -> submitted -> approved/rejected.

- `POST /submissions` - Create a new draft submission
- `GET /submissions` - List submissions (role-scoped, paginated)
- `GET /submissions/{id}` - Get full detail with verifiers & attachments
- `PUT /submissions/{id}` - Update draft/rejected submission
- `DELETE /submissions/{id}` - Delete draft submission
- `POST /submissions/{id}/submit` - Finalize draft: validate form fields, assign verifiers, submit to pipeline

### 5. Verification (`src/features/verification/`)

Verifier pipeline: sequential or parallel approval with HMAC e-signature.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /verifications` | List pending verifications for current user | Dosen/Pejabat |
| `POST /verifications/verify` | Approve or reject a submission | Dosen/Pejabat |

**Use cases**: `GetPendingVerificationsUseCase`, `VerifySubmissionUseCase`

**Depends on**: `ISubmissionRepository`, `INotificationRepository` (for HMAC signature)

### 6. File Attachments (`src/features/files/`)

Upload, download, and delete supporting documents (PDF, images, ZIP).

| Endpoint | Description | Auth |
|----------|-------------|------|
| `POST /files/upload` | Upload attachment (linked to submission) | Authenticated |
| `GET /files/download/{filename}` | Download with authorization check | Authenticated |
| `DELETE /files/{id}` | Delete attachment (uploader or operator) | Authenticated |

**Use cases**: `UploadFileUseCase`, `DownloadFileUseCase`, `DeleteFileUseCase`

**Depends on**: `IStorageService` (R2/local), `ISubmissionRepository`, `IAttachmentRepository`

### 7. Notifications (`src/features/notifications/`)

In-app notification feed for submission status changes.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /notifications` | List user's notifications (newest first) | Authenticated |
| `POST /notifications/{id}/read` | Mark as read | Authenticated |

**Use cases**: `ListNotificationsUseCase`, `MarkAsReadUseCase`

**Depends on**: `INotificationRepository`

### 8. Dashboard (`src/features/dashboard/`)

Role-aware statistics and recent activity feed.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /dashboard/stats` | Submission counts + recent activity | Authenticated |

**Use cases**: `GetDashboardStatsUseCase`

**Depends on**: `ISubmissionRepository`, `IActivityLogRepository`

### 9. FAQs (`src/features/faqs/`)

Public FAQ page, operator-managed.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /faqs` | List all FAQs | Public |
| `GET /faqs/{id}` | Get single FAQ | Public |
| `POST /faqs` | Create FAQ | Operator only |
| `PUT /faqs/{id}` | Update FAQ | Operator only |
| `DELETE /faqs/{id}` | Delete FAQ | Operator only |

**Use cases**: `ListFAQsUseCase`, `GetFAQUseCase`, `CreateFAQUseCase`, `UpdateFAQUseCase`, `DeleteFAQUseCase`

**Depends on**: `IFAQRepository`

---

## Build Order

All features complete (71 tests):

```
1. Auth             2. Users            3. Templates
4. Submissions      5. Verification     6. Files
7. Notifications    8. Dashboard        9. FAQs
```

---

## Optimization Opportunities

Evaluated May 2026. Prioritized by impact vs effort.

### High Priority

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 1 | **DB connection pool** | `engine` in `db.py` has no `pool_size` or `max_overflow` set. Under load, connections may exhaust. | Set `pool_size=10, max_overflow=20, pool_recycle=3600` |
| 2 | **R2 HTTP client** | `R2StorageService` creates a new `httpx.AsyncClient()` per request. Adds TCP handshake overhead on every upload/download/delete. | Create a shared `httpx.AsyncClient` instance (class-level) with connection pooling |
| 3 | **User list fetches all** | `ListUsersUseCase` fetches all users then filters/slices in Python. With 10K+ users, this loads entire table into memory. | Add `find_all_filtered()` to `IUserRepository` with server-side `WHERE` clauses and `LIMIT/OFFSET` |

### Medium Priority

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 4 | **Dashboard aggregations** | `GetDashboardStatsUseCase` loads all submissions then counts by status in Python. For operator (sees all), this fetches every row. | Use SQL `COUNT` + `GROUP BY status` query in a new repository method `count_by_status()` |
| 5 | **Notification ordering** | `find_by_user_id` returns unordered results; use case sorts in Python with `created_at`. | Add `ORDER BY created_at DESC` in the repository query |
| 6 | **Submission update delete-reinsert** | `update()` in `SubmissionRepository` deletes all verifiers/attachments then re-inserts them. Works but does extra round-trips. | Use SQLAlchemy `merge` with `cascade="merge"` on relationships, or use `session.merge()` with proper cascade config |
| 7 | **No DB index on `submission_verifiers.verifier_id`** | `find_pending_verifications` joins and filters by `verifier_id` but the column already has `index=True`. Verified OK. | (Already indexed) |

### Low Priority

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 8 | **Activity log no retention** | `activity_logs` table has no cleanup policy. Will grow unbounded in production. | Add TTL job or partition by month; keep last 90 days |
| 9 | **Template fields schema validation** | `fields` column is JSONB with no structural validation beyond template create/update. Malformed fields data could cause runtime errors in form validation. | Add Pydantic model for field schema and validate on write |
| 10 | **CORS allows `*` as fallback** | When `FRONTEND_BASE_URL` is unset, CORS allows all origins. Fine for dev, risky in production. | Enforce explicit `FRONTEND_BASE_URL` in production mode |
| 11 | **Local file storage path traversal** | `LocalStorageService` stores files under `uploads/` but does not sanitize the `file_path` in `delete()`. Path traversal via `../../etc/passwd` is restricted because file_path comes from our own UUID generation, not user input. | Low risk; add `os.path.basename()` guard as defense-in-depth |

### Not Recommended

| # | Idea | Reason |
|---|------|--------|
| - | Add Redis caching layer | Over-engineering for current scale. Revisit when DB hit rate becomes a bottleneck. |
| - | Switch to asyncpg connection pool directly | SQLAlchemy pool management is sufficient; no measurable gain. |
| - | Add Celery/background workers | Notification creation is fast enough inline. Revisit when email sending is enabled. |
