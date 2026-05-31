# Fix Plan — Schola Audit Remediation

Source: 4-agent audit (backend security, backend logic, frontend, infra). Items ordered by priority. Each has: problem, location, fix approach, and rough effort.

Status legend: ☐ todo · ◐ in progress · ☑ done

---

## Execution decisions (agreed)

- **Order:** Phase 0 (setup) → **Phase FE (#8–#17)** → Phase 1 backend criticals → Phase 2 → Phase 3 → Phase 4. Frontend issues go first per request; backend criticals follow immediately after (they're security/data-loss — don't let them slip).
- **Branch:** all work on the current `walid/frontend-bug-fix` branch. (Backend criticals may warrant their own branch later; revisit when we get there.)
- **Commits:** one commit per fixed item, after its test passes. Reference the item id in the message (e.g. `fix(FE-05): ...`, `fix(audit-2): IDOR ...`).
- **Verification:** every fix ships with a test. Backend uses the existing `pytest` suite. Frontend test infra doesn't exist yet → **Phase 0** stands it up first.
- **FE-10 localization:** full sweep across all components (done last, since other FE fixes add/alter strings).

---

## Phase 0 — Test & tooling setup (before any fix)

### 0a. ☐ Frontend test infrastructure
- Add **Vitest** + **@testing-library/react** + **@testing-library/jest-dom** + jsdom; add a `test` script to `frontend/package.json`; add `vitest.config` (or extend `vite.config.ts`) and a test setup file.
- Add the missing **`frontend/tsconfig.json`** (+ `tsc --noEmit` script) so tests and fixes are typechecked. (Audit infra #16.)
- Write one smoke test (App renders) to prove the harness works.
- Effort: M

### 0b. ☐ Confirm backend test workflow
- `poetry run pytest` already covers 71 tests. Confirm it runs green locally before starting backend fixes; no new infra needed.
- Effort: S

---

## Phase 1 — Critical (security holes + data corruption). Runs after Phase FE per agreed order, but is higher-severity — do not defer indefinitely.

### 1. ☐ Privilege escalation via public registration
- **Problem:** `POST /auth/register` accepts a `role` from the request body, so anyone can register as operator/admin.
- **Where:** `backend/src/features/auth/router.py:67`, `backend/src/features/auth/schemas.py:17`
- **Fix:** Remove `role` from `RegisterRequest`. Hard-code `role=UserRole.MAHASISWA` in `RegisterUseCase`. Roles may only be assigned via the operator-guarded `POST /users/`.
- **Test:** add a test asserting a register payload with `role=operator` still produces a MAHASISWA.
- Effort: S

### 2. ☐ IDOR — any user can read any submission
- **Problem:** `GetSubmissionUseCase` returns any submission's `form_data` with no ownership check.
- **Where:** `backend/src/features/submissions/use_case.py:45-49` (via `router.py:100`)
- **Fix:** Require requester to be the submitter, a verifier on the submission, or OPERATOR; else raise 403/404. Mirror the checks already used in update/delete/submit.
- **Test:** user B fetching user A's submission → 403/404.
- Effort: S

### 3. ☐ Verification email tokens never expire
- **Problem:** `generate_verification_token` sets no `exp`; `verify_email_token` decodes with `options={"verify_exp": False}`. Tokens valid forever.
- **Where:** `backend/src/infrastructure/services/jwt_token_service.py:55-87`
- **Fix:** Add an `exp` claim (e.g. 24h), remove `verify_exp: False`, enforce expiry on every verify. Use a distinct verification secret (see #7).
- Effort: S

### 4. ☐ User update silently wipes columns (data loss)
- **Problem:** `UserRepository.update` does `from_domain(entity)` + `merge`, but `User.from_domain` omits `is_active`, `phone`, `last_login_at`, `semester`, `profile_picture_url` → these reset to defaults on every `PUT /users/{id}`.
- **Where:** `backend/src/infrastructure/repositories/user_repository.py:34-39`, `backend/src/infrastructure/models/user.py:153-171`
- **Fix:** Load the existing row and mutate only changed fields (preferred), OR make `from_domain` carry all columns and ensure the domain entity holds them. Verify no other repo's `from_domain` drops columns.
- **Test:** update a user's `nama`, assert `is_active`/`phone`/`last_login_at` unchanged.
- Effort: M

### 5. ☐ Hardcoded admin seeded + credentials logged in all envs
- **Problem:** Lifespan unconditionally seeds `admin@ipb.ac.id` / `admin123` (+ `user123`) and logs creds at INFO.
- **Where:** `backend/src/app.py:20-33`, `backend/src/infrastructure/seed_data.py:25-26,38`
- **Fix:** Gate `seed_if_empty()` behind `settings.APP_ENV == "development"`. Remove credential logging. (Pairs with #15 — strong DB creds.)
- Effort: S

### 6. ☐ Submission ID collisions
- **Problem:** ID = `f"{prefix}/{year}/{random.randint(1,9999)}"` — only 9999 values/year, no uniqueness check → IntegrityError 500 on collision.
- **Where:** `backend/src/features/submissions/use_case.py:15-22`
- **Fix:** Derive a sequential counter from the DB (per prefix/year max+1 or a DB sequence) and retry on conflict; or switch to a UUID-backed unique id.
- Effort: M

---

## Phase 2 — High (auth hardening, atomicity, frontend access control)

### 7. ☐ JWT secret hardening
- Validate `JWT_SECRET_KEY` length (≥32 chars, reject the `change-me-...` default) at startup. Pin algorithm to a hardcoded `HS256` constant instead of `os.getenv("JWT_ALGORITHM")`. Give verification tokens their own secret (`VERIFICATION_SECRET_KEY`) rather than falling back to `JWT_SECRET_KEY`.
- **Where:** `backend/src/core/config.py:25-42`
- Effort: S

### 8. ☐ Password hashing is PBKDF2, not Argon2
- **Problem:** `ArgonPasswordService` actually uses `passlib pbkdf2_sha256`. `argon2-cffi` is already a dependency.
- **Where:** `backend/src/infrastructure/services/argon_password_service.py:3,17`
- **Fix:** Switch to `passlib.hash.argon2` (Argon2id). Existing PBKDF2 hashes: passlib can verify the old scheme during transition, or force resets. Decide migration strategy.
- Effort: M

### 9. ☐ No rate limiting on auth endpoints
- **Problem:** `rate_limit_dependency` exists but is wired nowhere; login/register/verify are unthrottled.
- **Where:** `backend/src/core/rate_limiter.py`, `backend/src/features/auth/router.py:81-113`
- **Fix:** Attach the dependency to `/auth/login`, `/auth/register`, `/verifications/verify`. Confirm the limiter backend (fastapi-limiter needs Redis) is configured, or use an in-process limiter.
- Effort: M

### 10. ☐ Non-atomic verification approve/reject
- **Problem:** `_approve`/`_reject` commit in multiple steps; `submission_repository.update` deletes & re-inserts all verifier rows. A mid-way failure leaves inconsistent state; concurrent verifiers overwrite each other's signatures.
- **Where:** `backend/src/features/verification/use_case.py:152-223`, `backend/src/infrastructure/repositories/submission_repository.py:43-63`, root cause `backend/src/infrastructure/db.py:21-24`
- **Fix:** One transaction per verification action (single commit). Update verifier rows in place by PK instead of delete-and-recreate. Consider an optimistic-lock version column. Longer-term: make the per-request session own one transaction and have repos flush (not commit).
- Effort: L

### 11. ☐ Unordered verification approves too early
- **Problem:** Final-step detection approves the whole submission on a single signer/highest-order approval even when `is_ordered_verification=False` and other verifiers haven't acted.
- **Where:** `backend/src/features/verification/use_case.py:215-219`
- **Fix:** In unordered mode, only mark approved when ALL verifier rows are approved.
- Effort: S

### 12. ☐ Frontend auth/role guard is client-side only
- **Problem:** Routing trusts `localStorage.isLoggedIn` + `currentUser` JSON; no token validation. Admin routes have no role check — any logged-in user can reach `/admin/*`.
- **Where:** `frontend/src/app/App.tsx:29-37,289-298,362-369`
- **Fix:** Validate session against the server on mount (call `/auth/me`), derive role from the server response. Wrap admin routes in a guard redirecting non-admins. (Server-side #1/#2 are the real enforcement; this is defense-in-depth + UX.)
- Effort: M

### 13. ☐ Remove demo credentials & insecure token handling from frontend
- Remove hardcoded quick-login creds (`SignInPage.tsx:55-69`) or gate behind `import.meta.env.DEV`.
- Token in `localStorage` is XSS-exfiltratable (`api.ts:29`) — prefer httpOnly cookie or add strict CSP; at minimum document the tradeoff.
- Fix env crash: `import.meta.env.VITE_API_BASE_URL.replace('/api','')` throws when unset (`SubmissionDetail.tsx:206,243`, `Verifikasi.tsx:402,476`) — use `(… ?? '')` or reuse the shared `BASE_URL`.
- Effort: M

---

## Phase 3 — Medium (correctness, infra hygiene)

### 14. ☐ CORS wildcard + credentials fallback
- `allow_origins=["*"]` with `allow_credentials=True` when `FRONTEND_BASE_URL` unset. Require an explicit allowlist; fail closed.
- **Where:** `backend/src/app.py:49-50`
- Effort: S

### 15. ☐ Secrets & ports in docker-compose
- DB password `postgres` hardcoded; port `5432` published to host. Source password from `${DB_PASSWORD:?}`; don't publish DB port in prod.
- **Where:** `docker-compose.yml:8-14`
- Effort: S

### 16. ☐ Dependency hygiene
- Investigate suspicious/unused deps `fastar==0.8.0`, `annotated-doc==0.0.4` in `backend/requirements.txt` — verify on PyPI, remove if accidental.
- Reconcile `pyproject.toml` vs `requirements.txt` drift (missing `fastapi-limiter`, `argon2-cffi`, `sentry-sdk`, etc.); commit one source of truth (`poetry.lock` or `poetry export`). Docker builds from requirements.txt, so drift = runtime mismatch.
- Effort: M

### 17. ☐ Dashboard correctness
- Counts mix "own" vs "verified" submissions (`dashboard/use_case.py:31-36`, `submission_repository.py:192-213`) — separate submitter vs verifier stats.
- `sorted(logs, key=lambda l: l.created_at or "")` crashes (datetime vs str) if any `created_at` is None; also sorts/limits in Python — push `order_by(created_at.desc()).limit(10)` to the repo. (`dashboard/use_case.py:40`)
- Effort: M

### 18. ☐ File ops & validation
- File delete: storage delete + DB delete not atomic (`files/use_case.py:191-195`) → delete DB row first, commit, then best-effort blob delete.
- Local download path join could mismatch/escape `UPLOAD_DIR` (`files/router.py:87-94`) → store one canonical relative key and verify resolved path stays under `UPLOAD_DIR`.
- `list`-shaped `form_data` skips all required-field validation (`submissions/use_case.py:149-167`) → handle or reject the list shape.
- Effort: M

### 19. ☐ Add CI + tests
- No CI exists; 71 backend tests never run automatically. Add a GitHub Actions workflow: backend `pytest` (with a Postgres service) + frontend `npm run build`.
- Frontend has zero tests and no `tsconfig.json` → add `tsconfig.json` + `tsc --noEmit` gate, and Vitest with a smoke test.
- Add a `HEALTHCHECK` to the API image; run migrations as a separate step (not racing on multi-worker startup).
- Effort: L

---

## Phase 4 — Low (cleanup)
- Frontend: replace pervasive `any` with response interfaces; fix `err.response` usage (client is fetch, not axios) → use `err.message`; stable list keys instead of array index; render loading states in admin lists; stop forcing `is_ordered_verification=true` on edit; add `aria-label` to icon buttons; remove dead `href="#..."` links and `alert()`-only download stubs.
- Backend: pagination bounds on `page`/`limit` (users router); clean 409 on template delete with dependent submissions; consistent `UserResponse` shape between `/auth/me` and `/users/{id}`.

---

## Phase FE — GitHub Frontend Issues (#8–#17)

Tracked issues on branch `walid/frontend-bug-fix`. Titles are Bahasa Indonesia; locations from the audit. ⚠️ marks overlap with audit items above — fix once, close both.

### FE-05 (#12) ☐ Login failure redirects to landing page ⚠️ (audit api.ts 401)
- **Problem:** Wrong email/password refreshes and bounces to landing instead of staying on login with an error.
- **Where:** `SignInPage.tsx` `performLogin` catch block; `api.ts:52-57` 401 interceptor auto-redirects even when no token exists.
- **Fix:** In `api.ts`, only auto-redirect on 401 if a token was present (i.e. a real session expired), not for a login attempt. Handle login errors locally via an `error` state, no navigation / no `window.location.href`.
- **Highest priority of the FE set** — blocks usable login. Effort: S

### FE-04 (#11) ☐ Negative-case / error-handling UI ⚠️ (audit #9/#12/#13)
- **Problem:** Errors (login, create letter, finalize, verify) aren't surfaced well — currently `alert()`-only, and `err.response.data.detail` is always undefined (client is fetch, not axios, so use `err.message`).
- **Fix:** Adopt one consistent toast/snackbar (sonner is already a dep) + inline form errors. Cover: login fail, empty/short password (real-time), template-not-found / missing required field on create, missing verifier on finalize, empty rejection reason on verify.
- **Where:** `SignInPage.tsx`, `Ajuan.tsx`, `Verifikasi.tsx`, `AdminUserManagement.tsx:175,217`, `api.ts:59`. Effort: M

### FE-07 (#14) ☐ In-app notifications not working ⚠️ (audit frontend #6/#7)
- **Problem:** Bell icon shows nothing; the effect refetches on dropdown-open and there's no interval poll despite the comment.
- **Where:** `App.tsx:112-118,160-168`
- **Fix:** Poll `GET /api/notifications` on a 30s interval + once on mount (drop the `showNotifications` dep). Show unread-count badge on the bell. Render a dropdown panel of recent notifications. Wire "mark as read" to `PATCH /api/notifications/{id}/read` (batch with `Promise.all`, surface failures).
- Effort: M

### FE-08 (#15) ☐ Admin Beranda feature buttons not linked ⚠️ (audit frontend LOW)
- **Where:** `Beranda.tsx`
- **Fix:** Add `navigate()` on each card/button: Pengajuan→`/admin/submissions`, Template Form→`/admin/forms`, Panduan→`/admin/panduan`, FAQ→`/admin/faq`, Pengguna→`/admin/users`. (While here, replace the mock `mockGuides.length`/`mockFAQs.length` KPI counts with real data — audit LOW #21.)
- Effort: S

### FE-06 (#13) ☐ Letter-type selection should jump straight to the right form
- **Where:** `Ajuan.tsx` (step 1 → step 2)
- **Fix:** On "Ajukan" for a letter-type card, store `template_id` and advance to step 2 with fields populated from that template. If arriving from the landing page with a letter-type param, auto-select it. (Note: don't reintroduce the `is_ordered_verification=true` overwrite on edit — audit frontend #10.)
- Effort: M

### FE-01 (#8) ☐ Inconsistent submission title between Riwayat & Verifikasi tables
- **Problem:** Title mapping from `formData` differs between `Diajukan.tsx` and `Verifikasi.tsx`.
- **Fix:** Centralize title extraction in `utils/submissions.ts` (single source of truth, same key — `formData["field-judul"]` / `"Judul"`) and use it in both tables.
- Effort: S

### FE-02 (#9) ☐ Differentiate Verifier vs Signer UI/workflow
- **Where:** `Verifikasi.tsx` + verification detail modal
- **Fix:** Distinct action-button color/label (Verifier "Setujui" vs Signer "Tanda Tangani"), role badge in modal header, an extra confirmation checkbox before signing, and a digital-signature icon for the signer action.
- Effort: M

### FE-03 (#10) ☐ Show/Hide password toggle on login
- **Where:** `SignInPage.tsx`
- **Fix:** Add Lucide `Eye`/`EyeOff` toggle inside the password input; `showPassword` state switches `type` between `"password"`/`"text"`.
- Effort: S

### FE-09 (#16) ☐ "Hubungi Admin" mailto with prefilled format (new feature)
- **Where:** `SignInPage.tsx`
- **Fix:** Add a "Hubungi Admin" link: `mailto:admin@ipb.ac.id?subject=Permintaan Akun Schola&body=Nama Lengkap: ...%0ANIM: ...`. Show the required-format instruction (Nama Lengkap & NIM) in the UI. (Replaces the current dead `href="#contact-admin"` — audit LOW #18.)
- Effort: S

### FE-NEW ☐ Open verifier/signer selection to all users (except operators)
- **Goal:** Any user may be picked as a *verifikator* or *penandatangan*, not just `dosen_pejabat`. Scope = all users **except operators** (operators stay excluded).
- **Where:** `frontend/src/app/utils/users.ts:79` (`fetchVerifiers`) hardcodes `role: 'dosen_pejabat'`. The backend already permits any non-operator assigned verifier to act (`backend/src/features/verification/router.py:25-28` `_block_operator`), so this is primarily a frontend change.
- **Fix:** Drop the `role` filter from `fetchVerifiers` (fetch all users, `limit` raised/paginated). Exclude operators client-side (`role !== 'operator'`), and ideally exclude the current submitter from their own verifier list. Keep search by name/id as-is.
- **Watch out:**
  - `/users` list returns paginated results — `limit: 100` may truncate once "everyone" is eligible. Use search-driven server queries (pass `search` to the endpoint) instead of fetching all + filtering client-side, or paginate.
  - Confirm the verify use case has no additional role gate beyond submission-membership (it keys on `verifier_id`), so a mahasiswa-as-verifier can actually approve/sign.
  - Pairs with **FE-02** (verifier vs signer UI) — both touch verifier selection/roles; do them together to avoid conflicts.
- **Test:** `fetchVerifiers` search returns non-dosen users; an operator is never selectable.
- Effort: S–M

### FE-10 (#17) ☐ Localize ALL UI text to Bahasa Indonesia (full sweep)
- **Problem:** Mixed English/Indonesian across the UI.
- **Scope:** Full sweep — every English string in every component (excluding generated `src/imports/` and shadcn `components/ui/` internals, but including how they're used). Translate labels, placeholders, error/success messages, buttons, tooltips, status badges (Draft/Pending/Approved/Rejected → Draf/Menunggu/Disetujui/Ditolak), modal/confirmation copy.
- **Approach:** Audit pass to list all English strings, then translate. Consider centralizing repeated strings (status labels, common buttons) so future text stays consistent.
- **Do this last** — large surface area, and it touches strings every other FE fix adds/changes. Effort: L

---

## Suggested execution order

Per the agreed decisions above:

1. **Phase 0** — stand up frontend Vitest + tsconfig (0a), confirm pytest green (0b). One-time, blocks everything that needs a test.
2. **Phase FE (#8–#17)** on `walid/frontend-bug-fix`, in this order:
   - **FE-05** first — login is broken.
   - **FE-04 + FE-07** — error handling + notifications (overlap audit frontend items).
   - Smaller UI wins: **FE-01, FE-03, FE-08, FE-09**.
   - **FE-02, FE-06** — more involved workflow/UX.
   - **FE-10** last — full localization sweep touches strings the others change.
   - ⚠️ FE-05/FE-04 also touch the audit's frontend auth fix (#12/#13) — coordinate so they don't conflict; doing the 401-redirect fix once satisfies both.
3. **Phase 1** backend criticals — security/data-loss; do not let these slip behind the FE work. #1/#2/#5 trivial, #4/#6 need care, #3 pairs with #7.
4. **Phase 2** — #10 (verification transaction refactor) is the largest; give it its own PR.
5. **Phase 3 / 4** as follow-up hygiene PRs.

One commit per item after its test passes (`fix(FE-05): ...`, `fix(audit-2): ...`). Add a regression test for every fixed item so the bug can't return.
