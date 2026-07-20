# Architecture

This app follows the layered / "dependencies point inward" structure from the
vibe-coding-rules standard. Transport (HTTP/UI) sits at the edge; business logic
is framework-agnostic and independently testable.

## Backend (edge → core)

```
routers/          HTTP transport — thin controllers, no business logic
  ├─ auth.py       (login → JWT, reset)
  ├─ users.py      (register, /me, admin list)
  ├─ notes.py      (token-scoped CRUD)
  └─ admin.py      (admin-only stats)
        │  (calls)
        ▼
services/         Business logic — auth, rules, ownership, transactions
  ├─ user_service.py
  └─ note_service.py
        │  (calls)
        ▼
repositories/     Data access — all SQLAlchemy queries live here
  ├─ user_repository.py
  └─ note_repository.py
        │  (uses)
        ▼
models.py         ORM entities (User 1—* Note)
```

Cross-cutting pieces:

- `schemas.py` — Pydantic models; the validated request/response contract.
- `security.py` — bcrypt password hashing/verification.
- `tokens.py` — reusable JWT create/decode (drop-in for other projects).
- `dependencies.py` — auth guards `CurrentUser` (any logged-in user) and
  `AdminUser` (role check → 403); attach either to a route to protect it.
- `exceptions.py` — domain errors (`NotFoundError`, `ConflictError`,
  `ValidationError`, `AuthError`) raised by services; **`main.py` maps them to
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
| Change the request/response shape | `schemas.py`                   |
| Add a new error → status mapping  | `exceptions.py` + `main.py`    |

## Frontend (edge → core)

React + TypeScript + Tailwind CSS (Vite).

```
App.tsx               view switch (landing ↔ notes) + auth modal orchestration
  ├─ pages/           screen-level composition
  │    ├─ LandingPage.tsx   cinematic hero
  │    └─ NotesPage.tsx     logged-in workspace
  ├─ components/      presentational pieces — state via props
  │    ├─ BackgroundVideo.tsx  looping video + custom rAF fade system
  │    ├─ AuthModal.tsx        glassmorphic create/login (username + PIN)
  │    └─ NoteEditor.tsx       create/edit form
  ├─ hooks/           logic: useAuth (session), useNotes (data + async states)
  ├─ services/        api.ts — the only module that knows HTTP/endpoints
  └─ types.ts         shared domain types mirroring the API
```

Data/logic is separated from views: components are presentational, hooks own
state and side effects, and `services/api.ts` is the single typed boundary to
the backend. `index.css` holds the font import, Tailwind layers, and the
`.liquid-glass` style shared across every screen.

## Key design decisions

- **Ownership-scoped notes.** Notes are addressed as `/users/{id}/notes/...`
  and the service treats "not owned" identically to "not found" — closing the
  IDOR gap without leaking whether a note exists.
- **PINs are hashed, never stored raw.** `security.py` (bcrypt) sits behind the
  service; login and registration are the only callers.
- **Same login error either way.** An unknown username and a wrong PIN both
  raise `AuthError` (→ 401), so usernames can't be enumerated.
- **Errors as domain exceptions, mapped at the edge.** Business logic stays
  free of HTTP concerns and is unit-testable without a web server.
- **Repositories wrap all queries.** Swapping the DB or query strategy doesn't
  ripple into services or routers.
