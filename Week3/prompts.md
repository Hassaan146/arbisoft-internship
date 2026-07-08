# Week 3 — Prompts & Consolidated Log

This branch (`week-3`) carries the full codebase from Weeks 1–2 plus the Week 3
authentication & authorization work. Below is a consolidated log of what was
built each week, with the Week 3 prompts spelled out in full.

## Week 1 — Frontend + Reviews CRUD API

- Veldara front end: landing page + About / Contact / Reviews pages with
  client-side routing and a scroll-driven 3D-style video hero.
- **Reviews CRUD REST API** (FastAPI + Pydantic), layered/modular architecture,
  Ruff lint (clean), pytest tests, anonymous inline review editing.

## Week 2 — Notes app (CRUD + PIN auth + cinematic UI)

- **Notes CRUD REST API** (FastAPI + SQLAlchemy) with a **User 1—\* Note** ORM
  relationship, Pydantic validation, correct status codes, Ruff + pytest.
- React + TypeScript + Tailwind front end: cinematic video hero, liquid-glass
  UI, glassmorphic auth + notes pages.
- Username + 4-digit PIN auth (bcrypt-hashed), password reset flow.
- Production-readiness pass (rate limiting, CSP/security headers, logging,
  pagination, request timeouts) and an AI reviewer + fixer agent cycle.

## Week 3 — JWT Authentication & Role-Based Authorization

### Prompt 1 — JWT auth + RBAC + tests

```
Add JWT authentication to the Week 2 API. Fully functional JWT: the token is
returned on login and sent as a Bearer header on every request (JWTs are not
emailed). Add role-based authorization with an admin and a normal user. The
admin can open an admin panel showing counts only — how many users, how many
have logged in, how many notes — but never the contents of any note. Write at
least 5 API tests covering auth + CRUD + error paths, and at least 1 integration
test that runs the happy path end-to-end. Make the JWT auth modular so it can be
dropped into another project with minimal changes.
```

### Prompt 2 — Branch, README, and prompts

```
Push the Week 3 code (including authentication) to a new week-3 branch. Add a
README for Week 3 describing the changes. Update the prompts: in Week 1 add the
prompt for the CRUD work, and in Week 3 add the prompt of everything added
across the weeks — authentication, authorization, and the rest. Commit using a
professional (Conventional Commits) scheme.
```

### What was delivered in Week 3

- **JWT authentication** — login returns a signed Bearer token; the note owner
  is derived from the token (routes moved to `/notes`), closing the IDOR gap.
- **Role-based authorization** — `admin` vs `user`; admin seeded from env;
  `/admin/stats` and `/users` are admin-only (403 otherwise); admin sees counts
  only, never note contents.
- **Reusable auth module** — `app/tokens.py` (create/decode JWT) + the
  `CurrentUser` / `AdminUser` FastAPI dependencies.
- **Tests** — JWT unit tests + auth/CRUD/RBAC API tests + 1 end-to-end
  integration test (25 total, all green; Ruff clean).
- **Frontend** — stores the JWT, sends it as a Bearer header, restores the
  session via `/users/me`, and adds a glassmorphic admin panel for admins.

See [README.md](README.md) for the full Week 3 write-up.
