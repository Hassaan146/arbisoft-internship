# Notes App — Week 2

A full-stack **CRUD Notes application** with a cinematic UI: a FastAPI +
SQLAlchemy REST API and a React + TypeScript + Tailwind front end.

Sign in with a **username + 4-digit PIN**, then each user gets their own notes.

Built across Weeks 2–3:

- ✅ CRUD REST API for a resource (**Notes**)
- ✅ ORM model with a relationship (**User 1—* Note**, one-to-many)
- ✅ **JWT authentication** (Bearer token) + **role-based authorization** (admin vs user)
- ✅ Username + 4-digit PIN credentials (bcrypt-hashed; register + login + reset)
- ✅ Input validation (Pydantic) + correct HTTP status codes
- ✅ Backend linter clean pass (**ruff**) + frontend **ESLint/Prettier/tsc**
- ✅ Unit + API + integration tests (pytest) — reviewed and verified
- ✅ Modularity/architecture review pass (see [ARCHITECTURE.md](ARCHITECTURE.md))

## Layout

```
notesapp/
├── backend/      FastAPI REST API (Python)
└── frontend/     React + TypeScript + Tailwind single-page app (Vite)
```

## The app

- **Landing hero** — full-screen looping background video, liquid-glass UI,
  Instrument Serif type. "Sign Up" / "Login" open a glassmorphic auth modal.
- **Auth** — create a user (name + 4-digit PIN) or log in; the server returns a
  **JWT** kept in `localStorage` and sent as a Bearer token on every request.
- **Notes workspace** — the logged-in user's notes with create / edit / delete,
  in the same cinematic glass style.
- **Admin panel** — users with the `admin` role get a dashboard of aggregate
  counts (users, logins, notes) — never any note contents.

## Backend — run it

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (use: source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
cp .env.example .env          # optional; sane defaults work out of the box
uvicorn app.main:app --reload
```

- API docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Environment variables (`backend/.env`)

| Key            | Default                     | Purpose                              |
| -------------- | --------------------------- | ------------------------------------ |
| `APP_NAME`        | `Notes API`              | Display name.                              |
| `DATABASE_URL`    | `sqlite:///./notes.db`   | SQLAlchemy DB URL.                         |
| `CORS_ORIGINS`    | `http://localhost:5173`  | Comma-separated allowed origins.          |
| `JWT_SECRET`      | (dev default)            | **Change in prod.** Signs the JWTs.       |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60`         | Token lifetime.                           |
| `ADMIN_USERNAME` / `ADMIN_PIN` | `admin` / `1234` | Admin seeded on startup if missing.  |

### Quality gates

```bash
ruff check .            # lint  (clean)
ruff format --check .   # format (clean)
pytest -q               # 25 tests, all green
```

## Frontend — run it

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173 (proxies /api -> :8000)
```

The dev server proxies `/api/*` to the backend, so start the backend first.

### Quality gates

```bash
npm run lint            # ESLint (clean)
npm run format:check    # Prettier (clean)
npm run build           # tsc --noEmit + production build
```

## REST API reference

Auth is **JWT Bearer**: log in, get a token, send `Authorization: Bearer <token>`
on every protected call. The note owner is derived from the token (no `{user_id}`
in the URL), so cross-user access is impossible.

| Method   | Path                     | Auth        | Description                        | Success |
| -------- | ------------------------ | ----------- | --------------------------------- | ------- |
| `POST`   | `/users`                 | public      | Register (username + 4-digit PIN) | `201`   |
| `POST`   | `/auth/login`            | public      | Log in → returns a JWT            | `200`   |
| `POST`   | `/auth/reset-password`   | public      | Set a new PIN for a username      | `200`   |
| `GET`    | `/users/me`              | user        | The current user (from the token) | `200`   |
| `GET`    | `/users`                 | **admin**   | List all users (no note contents) | `200`   |
| `GET`    | `/notes`                 | user        | List my notes (paginated)         | `200`   |
| `POST`   | `/notes`                 | user        | **Create** a note                 | `201`   |
| `GET`    | `/notes/{id}`            | user        | **Read** one of my notes          | `200`   |
| `PUT`    | `/notes/{id}`            | user        | **Update** one of my notes        | `200`   |
| `DELETE` | `/notes/{id}`            | user        | **Delete** one of my notes        | `204`   |
| `GET`    | `/admin/stats`           | **admin**   | Aggregate counts only (no contents) | `200` |

The PIN must be exactly 4 digits. List pagination: `?limit=` (1–100, default 50)
and `?offset=` (≥0).

Error conventions: `401` missing/invalid token or bad login, `403` authenticated
but not an admin, `404` not found / not owned, `409` duplicate username, `422`
validation failure, `429` rate limit exceeded.

## Reusing the JWT auth module

The auth layer is written to drop into another project with minimal changes:

- [`app/tokens.py`](backend/app/tokens.py) — framework-agnostic `create_access_token` /
  `decode_access_token`. Depends only on PyJWT + three settings
  (`jwt_secret`, `jwt_algorithm`, `access_token_expire_minutes`).
- [`app/dependencies.py`](backend/app/dependencies.py) — `CurrentUser` and `AdminUser`
  FastAPI dependencies. Add `user: CurrentUser` to any route to require login,
  or `_: AdminUser` to require the admin role.

To reuse: copy `tokens.py`, add the three config values, and wire the two
dependencies to your user model.

## Production-readiness practices

Applied from the vibe-coding-rules checklist:

- **JWT auth + RBAC** — signed Bearer tokens; `admin` vs `user` roles enforced
  by dependencies; the note owner comes from the token, closing the IDOR gap.
- **Password hashing** — 4-digit PINs stored as salted `bcrypt` hashes only.
- **Rate limiting** — per-client limiter (`slowapi`), `429` + `Retry-After`.
- **Error handling** — domain errors mapped to status codes; a catch-all logs
  full context and returns a generic `500` (no internal leakage).
- **Logging** — central config; log identifiers, never payloads/secrets.
- **Pagination** — bounded `limit`/`offset` on list endpoints.
- **Security headers** — `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`.
- **CORS allowlist** — explicit origins, no wildcard.
- **Frontend resilience** — request timeout via `AbortController`.
- **Frontend UX** — explicit loading / empty / error states; typed API client.
