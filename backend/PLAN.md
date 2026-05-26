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
- `POST /submissions/{id}/submit` - Finalize draft: validate form fields, assign verifiers, submit

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

All features complete:

```
1. Auth             2. Users            3. Templates
4. Submissions      5. Verification     6. Files
7. Notifications    8. Dashboard        9. FAQs
```
