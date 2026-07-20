# Architecture

This app follows the layered / "dependencies point inward" structure from the
vibe-coding-rules standard. Transport (HTTP/UI) sits at the edge; business logic
is framework-agnostic and independently testable.

## Backend (edge → core)

```
routers/          HTTP transport — thin controllers, no business logic
  └─ notes.py      (CRUD)
        │  (calls)
        ▼
services/         Business logic — rules, transactions
  └─ note_service.py
        │  (calls)
        ▼
repositories/     Data access — all SQLAlchemy queries live here
  └─ note_repository.py
        │  (uses)
        ▼
models.py         ORM entities (Note)
```

Cross-cutting pieces:

- `schemas/` — Pydantic models; the validated request/response contract.
- `exceptions.py` — domain errors (`NotFoundError`, `ConflictError`,
  `ValidationError`) raised by services; **`main.py` maps them to
  HTTP codes**, so services never import FastAPI.
- `config.py` / `database.py` — twelve-factor config + session wiring.
- `dependencies.py` — FastAPI providers that inject a session-bound service.
- `logging_config.py` — central logging setup (log ids, never payloads/PII).
- Cross-cutting middleware in `main.py`: CORS allowlist, rate limiting
  (`slowapi`), and security headers.

**Where do I change X?**

| I want to…                        | Edit…                          |
| --------------------------------- | ------------------------------ |
| Add/change an endpoint            | `routers/`                     |
| Change a business rule            | `services/`                    |
| Change a DB query                 | `repositories/`                |
| Change the request/response shape | `schemas/`                     |
| Add a new error → status mapping  | `exceptions.py` + `main.py`    |

## Frontend (edge → core)

React + TypeScript + Tailwind CSS (Vite).

```
App.tsx               view switch (landing ↔ notes)
  ├─ pages/           screen-level composition
  │    ├─ LandingPage.tsx   cinematic hero
  │    └─ NotesPage.tsx     notes workspace
  ├─ components/      presentational pieces — state via props
  │    ├─ BackgroundVideo.tsx  looping video + custom rAF fade system
  │    └─ NoteEditor.tsx       create/edit form
  ├─ hooks/           logic: useNotes (data + async states)
  ├─ services/        api.ts — the only module that knows HTTP/endpoints
  └─ types.ts         shared domain types mirroring the API
```

Data/logic is separated from views: components are presentational, hooks own
state and side effects, and `services/api.ts` is the single typed boundary to
the backend. `index.css` holds the font import, Tailwind layers, and the
`.liquid-glass` style shared across every screen.

## Key design decisions

- **Errors as domain exceptions, mapped at the edge.** Business logic stays
  free of HTTP concerns and is unit-testable without a web server.
- **Repositories wrap all queries.** Swapping the DB or query strategy doesn't
  ripple into services or routers.
- **Bounded pagination.** List endpoints cap `limit` so a single request can
  never pull the whole table.
- **Stale-response guard on the client.** `useNotes` tracks a load id so an
  older in-flight response can never overwrite newer data.
