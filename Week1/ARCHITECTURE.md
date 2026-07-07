# Veldara — Architecture & Workflow (Demo Guide)

A conceptual walkthrough of the whole project: how it's built, how it runs, what
every file does, and how the tooling (ESLint, Prettier, Vitest) is wired. Written
to defend the architecture in a demo — concepts, not line-by-line code.

---

## 1. What the app is

A **single-page application (SPA)**: the browser loads one HTML page once, then
JavaScript swaps the visible content as you navigate — no full page reloads. It
has **four screens** (Home, About, Reviews, Contact) that share **one
continuously-playing cinematic flower video** as the background. The landing page
is a pixel-faithful replica of the reference design; the other three pages are
**glassmorphism** — frosted, semi-transparent panels floating over that same live
video.

---

## 2. The stack

| Layer | Tool | Role |
| --- | --- | --- |
| Build / dev server | **Vite** | Hot-reload dev server; bundles for production |
| UI | **React 18** | Builds the screen from reusable components |
| Navigation | **React Router v6** | Maps URLs to screens, client-side |
| Background | **HTML5 `<video>`** | The self-hosted flower clip, autoplay + loop |
| Particles | **Canvas 2D** | Drifting dots over the hero |
| Styling | **Plain CSS** | Theme tokens + glassmorphism (no framework) |
| Linting | **ESLint** (flat config) | Bug-catching + code rules |
| Formatting | **Prettier** | Consistent code style |
| Testing | **Vitest + Testing Library + jsdom** | Unit tests in a simulated DOM |

One-liner: *Vite builds it, React renders it, React Router routes it, and a
quality layer (ESLint + Prettier + Vitest) keeps it clean and correct.*

---

## 3. The "virtual environment"

Node has no `venv`; the isolated environment **is** the project folder. `npm
install` reads `package.json` and downloads dependencies into a local
`node_modules/` that belongs only to this project.

- `package.json` — manifest: dependencies + npm scripts.
- `package-lock.json` — pins exact versions for reproducible installs.
- `node_modules/` — the downloaded libraries (git-ignored; recreated by install).

---

## 4. How the app boots (render pipeline)

```
index.html                ← the ONE page the browser loads
  └─ <div id="root">       ← empty mount point
  └─ loads /src/main.jsx   ← JS entry point
        │
   main.jsx                ← boots React, mounts into #root
     ├─ React.StrictMode   (dev-only safety checks)
     └─ BrowserRouter      (enables URL routing)
          └─ <App/>
               │
        App.jsx            ← route table (URL → screen)
               ├─ "/"            → <Landing/>     (standalone)
               └─ <Layout/> wraps:
                    ├─ "/about"   → <About/>
                    ├─ "/reviews" → <Reviews/>
                    ├─ "/contact" → <Contact/>
                    └─ "*"        → <NotFound/>
```

The browser only loads `index.html` once. `main.jsx` is ignition (starts React +
router). `App.jsx` is the switchboard that picks a screen by URL and React swaps
it in with no server round-trip — that's the SPA.

---

## 5. Routing — the two-layout strategy

There are two kinds of page, so two layouts:

1. **Landing (`/`) stands alone** — a full-bleed, immersive replica with its own
   fixed navbar, video container, particles, and scroll choreography. Not wrapped
   in the shared layout.
2. **About / Reviews / Contact share `Layout`** — a common wrapper providing the
   shared video background, dark scrim overlay, glass navbar, footer, and an
   `<Outlet>` (the slot where React Router injects the current page).

Client-side routing = React Router intercepts link clicks, changes the URL, and
renders the matching component without reloading. `*` is the catch-all 404.

---

## 6. Visual layering (how glass floats over video)

Pure CSS stacking (`z-index`), with the video and overlay `position: fixed` so
they stay put while content scrolls over them:

```
z-index -10 / -2   Video           (fills viewport, furthest back)
z-index -1         Dark scrim       (keeps text readable over video)
z-index  0–2       Page content     (glass cards, text)
z-index  3         Particle canvas  (landing only)
z-index  50        Navbar           (always on top)
z-index  60        "Play background" fallback button (landing, only if needed)
```

Glassmorphism = semi-transparent background + `backdrop-filter: blur()` + a 1px
translucent border + soft shadow, so the moving video diffuses through each panel.

---

## 7. File map — "where do I change X?"

```
Week1/
├─ index.html              page title, fonts, the root div
├─ package.json            dependencies + npm scripts
├─ vite.config.js          build config + test (Vitest) config
├─ eslint.config.js        all linting rules
├─ .prettierrc             formatting rules
├─ .prettierignore         files Prettier skips
├─ public/flower.mp4       the self-hosted background video
└─ src/
   ├─ main.jsx             app entry (React + Router boot)
   ├─ App.jsx              ROUTE TABLE (add/remove pages here)
   ├─ index.css            global design system (theme + glass + nav + buttons)
   ├─ videoSource.js       video URL + robust autoplay helper
   ├─ components/
   │  ├─ layout/   Layout.jsx (shell) + Navbar.jsx
   │  ├─ ui/       reusable primitives — GlassCard, PageHead, FeatureCard,
   │  │            Stars, SocialLinks (+ index.js barrel)
   │  ├─ VideoBackground.jsx   looping background <video> for inner pages
   │  ├─ ContactForm.jsx       form UI + state
   │  └─ ErrorBoundary.jsx     catches render errors → fallback
   ├─ hooks/      custom hooks — useAutoplayVideo, useParticles, useHeroFade,
   │              useCardScrollMask, useScrollReveal (+ index.js barrel)
   ├─ data/       page content — about, reviews, contactPoints, landingCards
   ├─ pages/      Landing (+ Landing.css), About, Reviews, Contact, NotFound
   ├─ utils/contactValidation.js  PURE validation logic (no React)
   ├─ App.test.jsx                 routing tests
   └─ test/setup.js                test environment bootstrap

   (tests sit next to what they cover: ContactForm.test.jsx, ui/ui.test.jsx,
    pages/pages.test.jsx, App.test.jsx)
```

| To change… | Open |
| --- | --- |
| Add/rename/remove a page | `src/App.jsx` (+ a file in `src/pages/`) |
| Nav links | `Navbar.jsx` (inner) / `Landing.jsx` (landing) |
| Colors / theme / glass | `src/index.css` (`:root` variables at top) |
| The background video | replace `public/flower.mp4` |
| Video playback behavior | `src/videoSource.js` |
| Landing animations (particles, scroll, reveal) | `src/hooks/` |
| Reusable UI (glass card, page heading, stars) | `src/components/ui/` |
| Page text / content | `src/data/` |
| Landing hero text | `src/pages/Landing.jsx` (cards in `src/data/landingCards.js`) |
| Form fields | `src/components/ContactForm.jsx` |
| Form validation rules | `src/utils/contactValidation.js` |
| Linting rules | `eslint.config.js` |
| Formatting rules | `.prettierrc` |

---

## 8. The flower / background video subsystem

**The story:** the reference used a scroll-scrubbed video. We iterated (even a
procedural 3D flower at one point) but the right answer is: the flower IS the
video, so we use the exact clip and autoplay it on a loop.

**Self-hosting:** the clip is `flower.mp4`. It was originally a remote CDN URL,
but the cloud sandbox had no outbound internet and couldn't download it. It was
downloaded manually in a terminal (`Invoke-WebRequest`) into `public/`, and the
app now serves it same-origin at `/flower.mp4`. Why this is the better
architecture, not just a workaround:

- Same-origin → no CORS dependency, no cross-origin throttling.
- No external dependency → the CDN link can't expire or rate-limit.
- Vite bundles `public/flower.mp4` into `dist/` so the build is self-contained.

**Robust playback** (`videoSource.js` → `autoplayLoop`):

- Browsers only autoplay **muted** video → force `muted` as property AND
  attribute (React is unreliable about reflecting `muted`).
- A single `play()` can lose a race during render → retry on timers + media-ready
  events.
- Browsers pause video in hidden tabs → resume on `visibilitychange`.
- If autoplay is still blocked → start on the first scroll/click/tap, and the
  landing shows a "▶ Play background" button as a guaranteed manual fallback.

**The real bug we fixed:** the video loaded and decoded fine but stayed frozen.
Root cause was **`prefers-reduced-motion`** — the OS (e.g., Windows "animation
effects" off) reports it, and the code was honoring it by pausing the video.
Since the moving flower is the core experience (silent, non-interactive), the fix
was to always autoplay. Diagnosis was done by inspecting the live element's
`readyState`, `error`, `currentTime` vs. real time, `visibilityState`, and the
reduced-motion media query — not by guessing.

---

## 9. Styling architecture

Two CSS files, deliberately separated:

1. **`src/index.css` — the global design system.** A `:root` block of CSS custom
   properties (design tokens): backgrounds, text colors, three accents, glass
   background/border/blur, radius, max width. Everything references these tokens,
   so re-theming = changing a few variables. Also defines reusable blocks:
   `.glass`, `.container`, `.btn`, `.navbar`, `.feature-grid`, form fields, etc.
2. **`src/pages/Landing.css` — scoped to the landing.** Every rule is prefixed
   with `.veldara-page` so the exact-replica styles can't leak into the glass
   pages.

---

## 10. Form + validation architecture

Separation of concerns:

- **`utils/contactValidation.js`** — a pure `validate(values)` function (no React,
  no DOM) returning an errors object. Pure = trivially testable and reusable.
- **`components/ContactForm.jsx`** — UI + state: tracks values, runs `validate()`
  on submit, shows inline errors, clears each error as the user fixes it, shows
  success.

Client-side rules: name (required, ≥2), email (required, valid format), message
(required, ≥10). The form uses `noValidate` so our logic runs, not the browser's.

---

## 11. Linting — ESLint (flat config)

Linting = static analysis that reads code without running it and flags bugs/rule
violations. `eslint.config.js` uses ESLint 9's **flat config** — an array of
config objects applied in order:

1. **`ignores`** — skip `dist`, `node_modules`, `coverage`.
2. **`@eslint/js` recommended** — baseline JS correctness rules.
3. **Main block (`.js`/`.jsx`)**:
   - Language: latest ECMAScript, ES modules, browser + node globals, JSX on.
   - Plugins: **eslint-plugin-react** (+ its `jsx-runtime` preset so you don't
     import React in every file), **eslint-plugin-react-hooks** (Rules of Hooks —
     catches effect/re-render bugs), **eslint-plugin-react-refresh** (hot-reload
     safety).
   - Intentional overrides: `prop-types` off, `react-refresh/only-export-components`
     as a warning.
4. **Test-file override** — adds test globals (`describe`, `it`, `expect`, `vi`…).
5. **`eslint-config-prettier` last** — the bridge to Prettier (see §12).

Setup = install ESLint + plugins as devDependencies, add `eslint.config.js`, wire
the `lint` script. Run `npm run lint` (report) or `npm run lint:fix` (auto-fix).
"Clean lint pass" = zero errors and zero warnings.

---

## 12. Prettier — and how it coexists with ESLint

Prettier is an opinionated **formatter** (style only, not bugs). `.prettierrc`:
semicolons on, single quotes, ES5 trailing commas, 80-char width, 2-space indent,
always-parenthesized arrow params. `.prettierignore` keeps it off
`node_modules`/`dist`.

Why they don't fight: ESLint can also enforce style, which would conflict.
**`eslint-config-prettier`**, placed last in the ESLint config, switches off every
ESLint stylistic rule Prettier already handles. Division of labor: **Prettier
owns formatting, ESLint owns code quality.** Scripts: `npm run format` (rewrite),
`npm run format:check` (verify only).

---

## 13. Testing

Config lives in `vite.config.js` (`test` block): `globals` on, `jsdom`
environment, a setup file, CSS handling. Pieces:

- **Vitest** — the runner (Vite-native, fast).
- **jsdom** — a browser DOM simulated in Node, so components render without a real
  browser.
- **Testing Library** — render + query like a user (by label/role/text).
- **user-event** — simulate typing/clicking.
- **jest-dom** — readable matchers (`toBeInTheDocument()`).
- **`src/test/setup.js`** — loads jest-dom + cleans the DOM after each test.

What's tested: **17 tests across four suites** — `ContactForm.test.jsx` (pure
`validate()` + form behaviour), `ui/ui.test.jsx` (GlassCard, PageHead, Stars),
`pages/pages.test.jsx` (About, Reviews, NotFound render), and `App.test.jsx`
(routing: `/`, `/about`, 404). `setup.js` stubs media/canvas/IntersectionObserver
so the video/particle components render in jsdom. Run with `npm test` /
`npm run test:watch`.

---

## 14. Build, scripts & quality workflow

| Command | What happens |
| --- | --- |
| `npm run dev` | Vite dev server with hot-reload |
| `npm run build` | Optimized `dist/`: bundles & minifies, copies `public/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` / `lint:fix` | ESLint report / auto-fix |
| `npm run format` / `format:check` | Prettier write / verify |
| `npm test` / `test:watch` | Run unit tests |

Dev = serve on demand with hot-reload. Build = compile into small optimized
static files for deploy. Quality loop before every commit: **Format → Lint →
Test → Build**; all green = safe to commit.

---

## 15. Likely client questions

- **Why React?** Component reuse, huge ecosystem, the SPA standard.
- **Why Vite?** Much faster dev/build than CRA (which is deprecated).
- **How is it an SPA?** One HTML load; React Router swaps screens via `<Outlet>`.
- **How is the flower done?** A video, `flower.mp4`, self-hosted in `public/`
  (the sandbox had no internet, so it was downloaded manually); a helper
  guarantees it autoplays and loops.
- **Why did it freeze first?** `prefers-reduced-motion` paused it by design; we
  made the background always play.
- **Code quality?** ESLint (correctness) + Prettier (format, bridged by
  eslint-config-prettier) + Vitest unit tests, all as npm scripts.

---

## 16. Backend — the Reviews CRUD API (`backend/`)

The Reviews page is no longer static: a small **FastAPI** (Python) service
owns the review data and exposes it as a REST API. The frontend and backend
are two independent programs joined by one contract — JSON over `/api/*`.

### The layered architecture

```
HTTP request
  └─ app/main.py            edge: CORS allowlist, rate limiting, security
     │                      headers, global error handlers
  └─ app/api/routes/        controllers: parse/validate input, call ONE
     │  reviews.py          service method, pick the status code
  └─ app/services/          business logic: pagination, "not found" rules —
     │  review_service.py   knows nothing about HTTP
  └─ app/repositories/      data access: ReviewRepository interface +
        review_repository.py  a JSON-file implementation (atomic writes)
```

Dependencies point inward only. The service depends on the repository
*interface*, not the JSON implementation — swapping in SQLite/Postgres later
means writing one new repository class and changing one wiring line
(`app/api/deps.py`).

### Validation — Pydantic as the boundary

Every request body is parsed against `app/schemas/review.py` before any code
runs: name 2–80 chars, role 2–120, quote 10–1000, stars an integer 1–5.
Anything else is rejected with a `422` at the edge. Client-supplied `id` /
`created_at` fields are ignored — the server owns identity.

### Endpoints

`GET/POST /api/reviews`, `GET/PUT/DELETE /api/reviews/{id}`, plus
`GET /api/health`. List responses are paginated (`limit`/`offset`) and return
an `{ items, total, limit, offset }` envelope. Swagger docs are served at
`/api/docs`.

### How the frontend connects

- **Dev wiring:** `vite.config.js` proxies `/api` → `http://localhost:8001`,
  so the SPA calls same-origin paths and CORS never bites in dev.
- **`src/services/reviewsApi.js`** — the only module that touches `fetch`.
- **`src/hooks/useReviews.js`** — loads reviews, exposes
  `loading / live / offline` status; on `offline` the page gracefully falls
  back to the bundled sample reviews.
- **`src/components/ReviewForm.jsx`** — POSTs new reviews; client-side checks
  mirror the Pydantic rules for instant feedback, and the server re-validates.

### Backend quality loop

**Ruff** (lint + format, rules E/W/F/I/B/UP/SIM/C4/RUF in
`backend/pyproject.toml`) and **pytest** (26 tests: full CRUD integration
through FastAPI's TestClient + repository unit tests, each against a fresh
temp data file). Same philosophy as the frontend: Format → Lint → Test before
every commit.
