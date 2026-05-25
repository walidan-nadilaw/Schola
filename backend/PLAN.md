# Schola Backend — Feature Roadmap

Features to implement, derived from the [.ancient](file:///c:/Users/LENOVO/Documents/Projects/Schola/backend/.ancient/app/routers) codebase. Each feature follows the vertical slicing pattern described in [ARCHITECTURE.md](file:///c:/Users/LENOVO/Documents/Projects/Schola/backend/ARCHITECTURE.md).

---

## ✅ Completed

### 1. Auth (`src/features/auth/`)
- `POST /auth/register` — Register new user (IPB email only)
- `POST /auth/login` — Login, receive JWT
- `POST /auth/logout` — Stateless logout
- `GET  /auth/me` — Get current user profile

---

## 🔲 Planned

### 2. Users Management (`src/features/users/`)
Admin-only CRUD for managing users.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /users` | List/search users (paginated, filterable by role/department) | Authenticated |
| `GET /users/{id}` | Get single user profile | Authenticated |
| `POST /users` | Create user (admin bypass, email_verified=true) | Operator only |
| `PUT /users/{id}` | Update user attributes | Operator only |
| `DELETE /users/{id}` | Soft-delete (is_active=false) | Operator only |

**Use cases**: `ListUsersUseCase`, `CreateUserUseCase`, `UpdateUserUseCase`, `DeleteUserUseCase`

**Depends on**: `IUserRepository` ✅ (already exists)

---

### 3. Form Templates (`src/features/templates/`)
Dynamic letter form templates with JSON schema fields.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /templates` | List active templates | Public |
| `GET /templates/{id}` | Get single template | Public |
| `POST /templates` | Create template | Operator only |
| `PUT /templates/{id}` | Update template | Operator only |
| `DELETE /templates/{id}` | Soft-delete (is_active=false) | Operator only |

**Use cases**: `ListTemplatesUseCase`, `CreateTemplateUseCase`, `UpdateTemplateUseCase`, `DeleteTemplateUseCase`

**Depends on**: `IFormTemplateRepository` ✅ (already exists)

---

### 4. Submissions (`src/features/submissions/`)
Core letter request lifecycle: draft → pending → approved/rejected.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `POST /submissions` | Create a new submission (draft or pending) | Mahasiswa |
| `GET /submissions` | List submissions (role-scoped, paginated) | Authenticated |
| `GET /submissions/{id}` | Get full detail with verifiers & attachments | Authenticated |
| `PUT /submissions/{id}` | Update draft/rejected submission | Mahasiswa (owner) |
| `DELETE /submissions/{id}` | Delete draft submission | Mahasiswa (owner) |
| `POST /submissions/{id}/finalize` | Submit draft to verifier pipeline | Mahasiswa (owner) |

**Use cases**: `CreateSubmissionUseCase`, `ListSubmissionsUseCase`, `UpdateSubmissionUseCase`, `DeleteSubmissionUseCase`, `FinalizeSubmissionUseCase`

**Depends on**: `ISubmissionRepository` ✅, `IFormTemplateRepository` ✅, `INotificationRepository` ✅

---

### 5. Verification (`src/features/verification/`)
Verifier pipeline: sequential or parallel approval with HMAC e-signature.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /verifications` | List pending verifications for current user | Dosen/Pejabat |
| `POST /verifications/verify` | Approve or reject a submission | Dosen/Pejabat |

**Use cases**: `GetPendingVerificationsUseCase`, `VerifySubmissionUseCase`

**Depends on**: `ISubmissionRepository` ✅, `INotificationRepository` ✅, `ITokenService` ✅ (for HMAC signature)

---

### 6. File Attachments (`src/features/files/`)
Upload, download, and delete supporting documents (PDF, images, ZIP).

| Endpoint | Description | Auth |
|----------|-------------|------|
| `POST /files/upload` | Upload attachment (linked to submission) | Authenticated |
| `GET /files/download/{filename}` | Download with authorization check | Authenticated |
| `DELETE /files/{id}` | Delete attachment (uploader or admin) | Authenticated |

**Use cases**: `UploadFileUseCase`, `DownloadFileUseCase`, `DeleteFileUseCase`

**Depends on**: `IStorageService` ✅ (R2), `ISubmissionRepository` ✅

---

### 7. Notifications (`src/features/notifications/`)
In-app notification feed for submission status changes.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /notifications` | List user's notifications (newest first) | Authenticated |
| `POST /notifications/{id}/read` | Mark as read | Authenticated |

**Use cases**: `ListNotificationsUseCase`, `MarkAsReadUseCase`

**Depends on**: `INotificationRepository` ✅

---

### 8. Dashboard (`src/features/dashboard/`)
Role-aware statistics and recent activity feed.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /dashboard/stats` | Submission counts + recent activity | Authenticated |

**Use cases**: `GetDashboardStatsUseCase`

**Depends on**: `ISubmissionRepository` ✅, `IActivityLogRepository` ✅

---

### 9. FAQs (`src/features/faqs/`)
Public FAQ page, admin-managed.

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /faqs` | List all FAQs | Public |
| `GET /faqs/{id}` | Get single FAQ | Public |
| `POST /faqs` | Create FAQ | Operator only |
| `PUT /faqs/{id}` | Update FAQ | Operator only |
| `DELETE /faqs/{id}` | Delete FAQ | Operator only |

**Use cases**: `ListFAQsUseCase`, `CreateFAQUseCase`, `UpdateFAQUseCase`, `DeleteFAQUseCase`

**Depends on**: `IFAQRepository` ✅

---

## Suggested Build Order

Priority based on dependencies (each feature unlocks the next):

```
1. ✅ Auth              — done
2. 🔲 Users             — admin management, needed for verifier selection
3. 🔲 Templates         — needed before submissions
4. 🔲 Submissions       — core feature, needs templates
5. 🔲 Verification      — needs submissions
6. 🔲 Files             — needs submissions (attachments)
7. 🔲 Notifications     — triggered by submissions & verification
8. 🔲 Dashboard         — aggregates everything
9. 🔲 FAQs              — independent, can be done anytime
```
