# Week 2 — Prompts

## Study Plan / Topic List

HTTP fundamentals: methods, status codes, headers, request/response cycle
• REST API design: resources, verbs, idempotency, status code conventions
• CRUD operations end-to-end (Create / Read / Update / Delete)
• Backend framework fundamentals (e.g., Django / DRF, FastAPI, or Express)
• Routing on the backend: URL patterns, route handlers, middleware
• ORM concepts: models, migrations, relationships (Django ORM / SQLAlchemy / Prisma)
• Input validation & error handling (Pydantic / DRF serializers / Zod)
• Linting on the backend: ruff / flake8 / eslint
• Backend unit tests with pytest / jest — writing tests with AI assistance

## Today's Focus

These are the topics I'm going to study today:

* REST API Design
* Sources
* Verbs
* CRUD Operations

Now, from these topics, I want you to explain all these topics to me.

* CRUD is easy in Fast API.
* I'll pursue Fast API.
* PyDintec Routing is easy.
* MetalPay.
* Explain all these concepts to me.
* Input Validation.

I use PyDintec because I'm using Fast API. For linting, I use ESLint, and for backend unit tests, I'll write them using AI.

Repo: https://github.com/Hassaan146/arbisoft-internship

---

## This Week's Build Prompts (chronological)

The prompts I used to build the Notes app this week:

1. **Build the CRUD REST API (Notes app).** Landing page → "Get Started" → view
   notes / create note (like a professional notes app). Model with an ORM and a
   relationship (User → Notes, one-to-many). Validate inputs with Pydantic and
   return correct HTTP status codes. Configure a backend linter and a clean
   pass. Write AI-generated unit tests, then review and verify. Add a review
   agent for modularity/architecture issues. Keep the code modular. Apply the
   vibe-coding-rules skill. Simple React front end. Commit and push to week-2.

2. **Use the professional programming practices from the AI-rules (vibe-coding-rules) skill.**
   (Rate limiting, catch-all error handling + logging, pagination, request
   timeouts, etc.)

3. **Explain and document the backend** — a docstring/comment on each file and
   function (well-documented, not over-commented).

4. **Explain the backend conceptually** (workflow, each file's purpose, no code)
   and **provide an HTML explainer** styled in soft seashell + dusty mauve.

5. **Build a cinematic single-page hero** — full-screen looping background video
   with a custom rAF fade system, liquid-glass UI, Instrument Serif, dark
   aesthetic (React + TypeScript + Tailwind + lucide-react). Add
   **username + 4-digit PIN auth** (create user / login) and glassmorphic
   notes + auth pages. Add a **password reset** flow.

6. **Clean up:** remove the fake nav/social buttons and the email feature,
   rename the brand to "Notes", keep username+PIN (unique username) login/signup,
   and add a reset-PIN page. Deploy a **reviewer agent** (front + back) and a
   **fixer agent** to resolve the findings.

7. **Scope the fixes:** defer the two highest-severity auth findings (real JWT
   auth is planned for next week); apply all the other fixes.

---

## Week 3 Prompts

1. **Add JWT authentication + role-based authorization to the API.** Fully
   functional JWT (token returned on login, sent as a Bearer header on every
   request). Add an `admin` vs normal `user` role: the admin can open an admin
   panel that shows counts only — how many users, how many have logged in, how
   many notes — but never the contents of any note. Write ≥5 API tests covering
   auth + CRUD + error paths and ≥1 end-to-end integration test (happy path).

2. **Update prompts.md with this week's prompts, and make the JWT auth modular**
   so it can be dropped into another project with minimal changes (a reusable
   token module + `get_current_user` / `require_admin` dependencies driven by
   config).
