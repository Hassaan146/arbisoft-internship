# Contributing

## Commit message convention — Conventional Commits

This repo follows the [Conventional Commits](https://www.conventionalcommits.org/)
standard so history stays consistent, scannable, and tooling-friendly.

### Format

```
<type>(<optional scope>): <short summary in imperative mood>

<optional body — the what and why, wrapped ~72 cols>

<optional footer — BREAKING CHANGE:, Closes #123, Co-Authored-By:>
```

- **Summary**: imperative, lower-case, no trailing period, ≤ ~72 chars
  ("add login", not "added login" / "adds login").
- **Scope** (optional): the area touched, e.g. `feat(auth):`, `fix(notes):`.
- **Body** (optional): explain the reasoning, not the obvious diff.

### Types

| Type       | When to use it                                                    |
| ---------- | ----------------------------------------------------------------- |
| `feat`     | A new feature for the user.                                       |
| `fix`      | A bug fix.                                                        |
| `refactor` | Code change that neither fixes a bug nor adds a feature.          |
| `docs`     | Documentation only.                                              |
| `test`     | Adding or fixing tests.                                          |
| `chore`    | Tooling, config, deps, housekeeping (no src behavior change).    |
| `perf`     | A change that improves performance.                              |
| `style`    | Formatting/whitespace only (no logic change).                    |
| `build`    | Build system or external dependencies.                          |
| `ci`       | CI configuration and scripts.                                   |
| `revert`   | Reverts a previous commit.                                       |

### Breaking changes

Append `!` after the type/scope **and** add a `BREAKING CHANGE:` footer:

```
feat(api)!: derive the note owner from the auth token

BREAKING CHANGE: /users/{id}/notes routes are replaced by /notes.
```

### Examples

```
feat(auth): add username + 4-digit PIN login and registration
fix(notes): keep editor input when a create request fails
refactor(backend): extract the rate limiter into rate_limit.py
docs: add conceptual backend explainer
test(auth): cover PIN reset then login
chore(frontend): migrate tooling to TypeScript + Tailwind
```
