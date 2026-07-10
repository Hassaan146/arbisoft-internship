# Week 3 — Prompts & Consolidated Log

This branch (`week-3`) carries the full codebase from Weeks 1–2 plus the Week 3
authentication & authorization work. Below is a consolidated summary, followed
by the **full chronological log of every Week 3 prompt** used.

## Week 1 — Frontend + Reviews CRUD API

- Veldara front end: landing + About / Contact / Reviews pages with client-side
  routing and a scroll-driven 3D-style video hero.
- **Reviews CRUD REST API** (FastAPI + Pydantic), layered/modular architecture,
  Ruff lint (clean), pytest tests, anonymous inline review editing.

## Week 2 — Notes app (CRUD + PIN auth + cinematic UI)

- **Notes CRUD REST API** (FastAPI + SQLAlchemy), **User 1—\* Note** ORM
  relationship, Pydantic validation, correct status codes, Ruff + pytest.
- React + TypeScript + Tailwind front end: cinematic video hero, liquid-glass UI.
- Username + 4-digit PIN auth (bcrypt-hashed) + password reset.
- Production-readiness pass (rate limiting, CSP/headers, logging, pagination,
  request timeouts) and an AI reviewer + fixer agent cycle.

## Week 3 — JWT Authentication & Role-Based Authorization

### Headline prompt — JWT auth + RBAC + tests

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

Decisions given for the above: standard JWT (no email), admin seeded from `.env`
(`ADMIN_USERNAME` / `ADMIN_PIN`), track logins for the admin stats, and do the
work full-stack (backend + frontend).

## Full Week 3 prompt log (chronological)

1. Implement fully-functional JWT authentication + role-based authorization
   (admin vs user), an admin panel that shows only counts (users, logins,
   notes) and never note contents, ≥5 API tests, ≥1 end-to-end integration
   test, and a reusable/modular JWT layer.
2. Explain how to use the JWT authentication as a normal user, and what the
   admin username/password is.
3. "I don't see the JWT as an OAuth/OTP token" — explain where the token
   actually lives and how it is used (localStorage + Bearer header, not email).
4. Explain the integration test / the happy-path end-to-end test conceptually.
5. Add a professional commit (Conventional Commits), push the Week 3 code to a
   new `week-3` branch, and create a Week 3 README describing the changes.
6. Check the latest commit — and the commit times — of the week-1/2/3 branches.
7. Create a separate pull request for each branch (week-1, week-2, week-3).
8. Make all three pull requests target `main`.
9. Questions: will merging week-1 → week-2 → week-3 into main cause conflicts?
   Does merging overwrite or combine? What will `main` look like afterwards?
10. Should I make separate `-PR` branches for each week? (Advice: no.)
11. Restructure the branches so each contains only its own week's folder
    (remove the inherited folders), all PRs still pointing to `main`.
12. Put the complete Week 2 app **with** authentication into the `week-3` branch
    (it had been stripped out during the restructure).
13. Apply the supervisor's PR review comments on Week 2 (secrets from env, split
    `schemas/` into a package, rename repository methods, exception default
    messages, rate-limit from config, fix stale comments, blank-line style,
    consistent validators, single-source-of-truth validation, etc.), and apply
    the same fixes to Week 3.
14. Rename `count_logged_in` → `total_login_events`, and `total_logins` →
    `cumulative_login_count` (self-documenting names).
15. Provide a complete checklist confirming every supervisor change was made in
    Week 2 and Week 3.
16. Fix the Sourcery CI security findings on both branches: upgrade PyJWT
    (CVE-2026-32597, the `crit` header issue) and clear the Blue Oak license
    flag (pin `minimatch` to an ISC version).
17. Feedback: always fully document changes and trace their ripple effects on
    other files before pushing.
18. Deploy a Haiku review agent that reviews the code, corrects the issues, and
    pushes.
19. Correct the code and push to both `week-2` and `week-3`, and keep the PRs
    pointing to `main`.
20. Give a complete walkthrough of the Week 3 app.
21. Debug the `uvicorn` startup error (`ModuleNotFoundError: No module named
    'app'`).
22. Explain the logging configuration — where it is set up, where it is used,
    and where user responses are (and are not) logged.
23. Maintain `prompts.md` with all the Week 3 prompts and push it to the
    `week-3` branch.

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
- **Review follow-through** — supervisor fixes, a Haiku review-agent pass, and
  the Sourcery security fixes (PyJWT 2.13.0, ISC-licensed minimatch).

See [README.md](README.md) for the full Week 3 write-up.
