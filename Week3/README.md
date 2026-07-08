# Week 3 — JWT Authentication & Role-Based Authorization

Week 3 builds on the Week 2 Notes app (in [`../Week2/notesapp`](../Week2/notesapp))
by adding **real authentication and authorization**. The app now issues signed
JWT tokens on login, protects every note endpoint with them, and adds an
**admin** role with its own dashboard.

> The full application code lives under `Week2/notesapp/` and is carried into
> this branch. This file documents **what changed in Week 3**.

## Week 3 checklist

- ✅ Add JWT authentication to the API
- ✅ Add at least one role-based authorization rule (admin vs user)
- ✅ Write at least 5 API tests covering auth + CRUD + error paths
- ✅ Add at least 1 integration test running the happy path end-to-end

## What we added

### 1. JWT authentication

- **Login now returns a signed JWT** (`POST /auth/login` → `{ access_token, token_type, role }`).
- The client sends it as `Authorization: Bearer <token>` on every request.
- The **note owner is derived from the token**, not from the URL — notes moved
  from `/users/{id}/notes` to `/notes`. This closes the previous IDOR gap where
  one user could reach another's notes by changing the id.
- Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60) and are signed
  with `JWT_SECRET` (HS256).

### 2. Role-based authorization

- Users have a **`role`**: `user` (default) or `admin`.
- An **admin account is seeded on startup** from `ADMIN_USERNAME` / `ADMIN_PIN`
  (defaults `admin` / `1234`).
- **`GET /admin/stats`** and **`GET /users`** require the admin role — a normal
  user gets **403 Forbidden**.
- The admin dashboard shows **counts only** (total users, users logged in, total
  logins, total notes) and **never the contents of any note**.

### 3. Reusable, modular auth

Written so it can be dropped into another project with minimal changes:

- [`app/tokens.py`](../Week2/notesapp/backend/app/tokens.py) — framework-agnostic
  `create_access_token` / `decode_access_token`, driven by three config values.
- [`app/dependencies.py`](../Week2/notesapp/backend/app/dependencies.py) —
  `CurrentUser` (any logged-in user) and `AdminUser` (admin-only) dependencies.
  Add `user: CurrentUser` to protect a route, or `_: AdminUser` to require admin.

### 4. Tests (25 total, all green)

- **JWT unit tests** — token roundtrip, expiry, tampering, wrong secret.
- **API tests** — register, login→token, 401 (no/invalid token), 403 (non-admin),
  full CRUD, ownership, validation (422).
- **1 end-to-end integration test** — the happy path: register → login → create →
  list → update → admin stats → delete, all through real HTTP calls against a
  throwaway in-memory database.

### 5. Frontend

- Stores the JWT in `localStorage` and attaches it to every request.
- Restores the session on reload via `GET /users/me`.
- Adds a glassmorphic **admin panel** reachable from the notes header for admins.

## New / changed API endpoints

| Method | Path                   | Auth      | Purpose                          |
| ------ | ---------------------- | --------- | -------------------------------- |
| `POST` | `/auth/login`          | public    | Returns a JWT                    |
| `GET`  | `/users/me`            | user      | The current user (from token)    |
| `GET`  | `/users`               | **admin** | List users (no note contents)    |
| `GET`  | `/notes`               | user      | The caller's notes (token-scoped)|
| `POST` | `/notes`               | user      | Create a note                    |
| `GET/PUT/DELETE` | `/notes/{id}`| user      | Read / update / delete a note    |
| `GET`  | `/admin/stats`         | **admin** | Aggregate counts only            |

Error codes: `401` missing/invalid token or bad login, `403` not an admin,
`404` not found / not owned, `409` duplicate username, `422` validation, `429`
rate limited.

## How to run

See [`../Week2/notesapp/README.md`](../Week2/notesapp/README.md). In short:

```bash
# backend
cd Week2/notesapp/backend && uvicorn app.main:app --reload
# frontend (separate terminal)
cd Week2/notesapp/frontend && npm run dev
```

- Normal user: **Sign Up** with a username + 4-digit PIN.
- Admin: **Login** with `admin` / `1234`, then use the **Admin** button.
- Configure `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PIN` in `backend/.env`.
