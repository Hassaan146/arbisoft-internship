# Notes App — Week 2

A full-stack **CRUD Notes application** with a cinematic UI: a FastAPI +
SQLAlchemy REST API and a React + TypeScript + Tailwind front end.

Week 2 deliverables:

- ✅ CRUD REST API for a resource (**Notes**)
- ✅ ORM model + repository/service layering
- ✅ Input validation (Pydantic) + correct HTTP status codes
- ✅ Backend linter clean pass (**ruff**) + frontend **ESLint/Prettier/tsc**
- ✅ Unit + API + integration tests (pytest)
- ✅ Modularity/architecture review pass (see [ARCHITECTURE.md](ARCHITECTURE.md))

> Authentication (JWT) and role-based authorization are added in **Week 3**.

## Layout

```
notesapp/
├── backend/      FastAPI REST API (Python)
└── frontend/     React + TypeScript + Tailwind single-page app (Vite)
```

## The app

- **Landing hero** — full-screen looping background video, liquid-glass UI,
  Instrument Serif type, with a call to action that opens the workspace.
- **Notes workspace** — the notes collection with create / edit / delete, in the
  same cinematic glass style.

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

### Quality gates

```bash
ruff check .            # lint  (clean)
ruff format --check .   # format (clean)
pytest -q               # tests, all green
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

| Method   | Path                     | Description                        | Success |
| -------- | ------------------------ | ---------------------------------- | ------- |
| `GET`    | `/notes`                 | List notes (paginated)             | `200`   |
| `POST`   | `/notes`                 | **Create** a note                  | `201`   |
| `GET`    | `/notes/{id}`            | **Read** a note                    | `200`   |
| `PUT`    | `/notes/{id}`            | **Update** a note                  | `200`   |
| `DELETE` | `/notes/{id}`            | **Delete** a note                  | `204`   |
| `GET`    | `/health`                | Liveness check                     | `200`   |

List pagination: `?limit=` (1–100, default 50) and `?offset=` (≥0).

Error conventions: `404` not found, `409` conflict, `422` validation failure,
`429` rate limit exceeded.

## Production-readiness practices

Applied from the vibe-coding-rules checklist:

- **Rate limiting** — per-client limiter (`slowapi`), `429` + `Retry-After`.
- **Error handling** — domain errors mapped to status codes; a catch-all logs
  full context and returns a generic `500` (no internal leakage).
- **Logging** — central config; log identifiers, never payloads/secrets.
- **Pagination** — bounded `limit`/`offset` on list endpoints.
- **Security headers** — `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`.
- **CORS allowlist** — explicit origins, no wildcard.
- **Frontend resilience** — request timeout via `AbortController`.
- **Frontend UX** — explicit loading / empty / error states; typed API client.
