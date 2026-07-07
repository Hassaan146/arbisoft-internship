# Veldara Backend — Reviews CRUD API

A small, layered **FastAPI** service that powers the Reviews page of the
Veldara SPA. Reviews are validated with **Pydantic**, stored in a JSON file
behind a repository interface, linted with **Ruff**, and tested with
**pytest**.

## Quick start

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8001
```

- Interactive docs (Swagger UI): http://localhost:8001/api/docs
- Health check: http://localhost:8001/api/health

The frontend dev server (`npm run dev` in the repo root) proxies `/api/*` to
port 8001 (see `vite.config.js`), so the SPA talks to this API with no CORS
setup in development.

## API

| Method | Path                | Description                          | Success |
| ------ | ------------------- | ------------------------------------ | ------- |
| GET    | `/api/reviews`      | List reviews (paginated, newest 1st) | 200     |
| GET    | `/api/reviews/{id}` | Fetch one review                     | 200     |
| POST   | `/api/reviews`      | Create a review                      | 201     |
| PUT    | `/api/reviews/{id}` | Replace a review's fields            | 200     |
| DELETE | `/api/reviews/{id}` | Delete a review                      | 204     |

`GET /api/reviews` takes `limit` (1–100, default 50) and `offset` (≥0) and
returns `{ items, total, limit, offset }`.

A review body is validated by Pydantic before any logic runs:

```json
{
  "name": "Ada Lovelace",        // 2–80 chars
  "role": "Analyst, AE Ltd",     // 2–120 chars
  "quote": "At least 10 chars…", // 10–1000 chars
  "stars": 5                     // integer 1–5
}
```

Invalid payloads get a `422` with field-level details. Unknown ids get a
generic `404`. Unexpected errors are logged server-side and returned as a
generic `500` — internals never leak to clients.

## Architecture

```
app/
├── main.py              app factory: CORS allowlist, rate limiting,
│                        security headers, error handlers, router mounting
├── core/
│   ├── config.py        Settings via pydantic-settings (VELDARA_* env vars)
│   └── ratelimit.py     shared slowapi limiter (60/min default, 10/min writes)
├── schemas/review.py    Pydantic models — the validation boundary
├── api/
│   ├── deps.py          DI wiring: settings → repository → service
│   └── routes/reviews.py  thin controllers, one service call each
├── services/review_service.py      business logic; raises ReviewNotFoundError
└── repositories/review_repository.py
                         ReviewRepository interface + JSON-file implementation
                         (thread lock + atomic writes; swappable for a real DB)
```

Dependencies point inward: routes → service → repository interface. The
service knows nothing about HTTP; the repository knows nothing about reviews'
HTTP contract. Swapping the JSON store for SQLite/Postgres means writing one
new repository class.

**Storage:** `data/reviews.json` (created empty on first run from
`data/reviews.seed.json`; git-ignored so runtime data never lands in
commits). There are no pre-planted reviews — every review is user-created
through the API.

**Configuration:** every setting can be overridden with a `VELDARA_`-prefixed
environment variable, e.g. `VELDARA_DATA_FILE`, `VELDARA_CORS_ORIGINS`,
`VELDARA_RATE_LIMIT_ENABLED`.

## Quality gates

```powershell
.venv\Scripts\python -m ruff check .    # lint (E, W, F, I, B, UP, SIM, C4, RUF)
.venv\Scripts\python -m ruff format .   # formatting
.venv\Scripts\python -m pytest          # 26 tests
```

Tests run against a fresh temp-file repository per test (never the real data
file) with rate limiting disabled:

- `tests/test_reviews_api.py` — integration tests through FastAPI's
  TestClient: every verb's happy path, Pydantic validation rejections
  (bad stars, short/oversized fields, ignored client-supplied ids),
  pagination bounds, 404s, security headers.
- `tests/test_repository.py` — unit tests for the JSON store: seeding,
  id/timestamp assignment, persistence across instances, replace/delete
  semantics.

## Security posture (vibe-coding-rules checklist)

- **Input validation (3):** allowlist-style Pydantic constraints on every field.
- **Rate limiting (2):** per-IP, 60/min default, 10/min on writes, 429 + Retry-After.
- **CORS (6):** explicit origin allowlist, no wildcard.
- **Headers (7):** `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`.
- **Error handling (9):** generic messages to clients, full context to logs.
- **Secrets (1):** none required; all config via env vars.
- **Data integrity (23):** atomic writes + a lock serialising read-modify-write.
