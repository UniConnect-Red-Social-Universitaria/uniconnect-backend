# AGENTS.md — UniConnect Backend

## Quick start

```bash
cp .env_ejemplo .env    # then edit values
npm install
npx prisma generate
npx prisma db push       # sync schema to MongoDB
npm run dev              # nodemon on src/server.ts
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with nodemon (port 3000) |
| `npm test` | Jest all `*.test.ts` |
| `npm test -- -t "describe pattern"` | Run subset by name |
| `npm test -- tests/integration/` | Integration suite only |
| `npm test -- --coverage` | With coverage (threshold: 80%) |
| `npm run build` | Generate OpenAPI spec + `tsc` to `dist/` |
| `npx tsc --noEmit` | Type-check without emitting |
| `npm run generate:openapi` | Rebuild `openapi.json` from JSDoc |
| `npm run test:coverage` | Test + coverage report |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma db push` | Push Prisma schema to MongoDB |

## Architecture

- **Monorepo?** No — single backend package (`commonjs`, TypeScript).
- **Framework:** Express 5 + Socket.IO (real-time chat on same port).
- **Database:** MongoDB via Prisma ORM.
- **Auth:** JWT (`Authorization: Bearer <token>`). `DEV_MODE=true` skips Google token validation.
- **OpenAPI 3 spec** auto-generated from JSDoc in `*.routes.ts`. Served at `/docs` and `/openapi.json`.

## Module structure (clean architecture)

```
src/modules/<module>/
  application/     — use cases (*.use-cases.ts), optional validacion/ (Chain of Resp)
  domain/          — contracts.ts + entities/interfaces
  infrastructure/  — prisma-*.repository.ts, gateways, observers, schedulers
  interfaces/http/ — <module>.controller.ts + <module>.routes.ts
```

11 modules: `catalog`, `events`, `foro`, `groups`, `messages`, `materias`, `notifications`, `polls`, `recursos`, `sesiones`, `users`.

**Exception:** `recursos/` is flat (controller + routes + service, no layers).

## Dependency injection

Manual wiring in `src/container.ts` (no DI framework). Imports and instantiates all repositories, services, use cases, and schedulers. The Express app imports use cases from here. Socket.IO initializer also imports from container.

## Entrypoints

- `src/server.ts` — creates HTTP server, initializes Socket.IO, starts schedulers
- `src/app.ts` — Express app with all routes mounted at `/api/<entity>`

## Testing quirks

- Prisma client is **mocked globally** in `tests/setup/jest.setup.ts`. Tests do not need a real database.
- Integration tests in `tests/integration/` exercise the Express app layer with supertest (still uses mocked Prisma).
- `NODE_ENV=test` is set by Jest config. SMTP verification is skipped when `NODE_ENV === 'test'` (see `container.ts:80`).

## CI/CD

| Workflow | Triggers | What it does |
|---|---|---|
| `ci.yml` | push/PR to `main` or `developer` | TypeScript check + build + unit tests + integration tests + Slack notification |
| `pr-validation.yml` | PR to `main`/`developer` | Validates conventional commit title format `type(scope): desc`, checks conflicts, labels size |
| `pr-coverage.yml` | PR + CI completion | Runs coverage, comments on PR (threshold 80%) |
| `fly-deploy.yml` | push to `main` + CI passes | Builds, tests, deploys to Fly.io, health check at `/health`, Slack notification |
| `security-quality.yml` | push/PR + weekly | `npm audit`, outdated check, `tsc --noEmit` |

- Deployed to `https://uniconnect-backend.fly.dev`
- Health endpoint: `GET /health` (used by Fly.io checks and deploy workflow)
- Rollback commented out in CI config but documented as intent

## Conventions

- **Language:** Spanish — routes, controllers, models, comments, and error messages are in Spanish.
- **Route files:** always `*.routes.ts`, controllers always `*.controller.ts`.
- **Code style:** No ESLint or Prettier config found. Keep consistent with existing code.
- **No codegen** beyond Prisma and OpenAPI. Avoid adding new codegen.
- **PR titles** must match `type(scope): description` where type is `feat|fix|docs|style|refactor|test|chore|perf|ci|build`.

## Design patterns used

- **Decorator** — polls (logging/moderation gateway decorators), users (perfil decorators)
- **State** — groups (`group-state.ts`, 8 states)
- **Observer** — groups (socket + persistencia observers), messages (chat subject), notifications (event observer)
- **Chain of Responsibility** — foro (5 handlers), messages (7 message validators)
- **Strategy** — notifications (4 delivery strategies: in-app WS, email, push, daily digest)
- **Singleton** — `Auth` class, `ChatSubject`

## Env vars (required)

`PORT`, `JWT_SECRET`, `DATABASE_URL` (MongoDB). Optional: `GOOGLE_CLIENT_ID`, `DEV_MODE`, `SMTP_*`, `CLOUDINARY_*`, `NGROK_AUTHTOKEN`, `INSTITUTIONAL_EMAIL_DOMAINS` (defaults to `ucaldas.edu.co`).

## Notable

- No linter/formatter config — do not add one unless asked.
- No tests require a running database; Prisma is fully mocked.
- The `src/generated/` directory is gitignored.
- VS Code setting: `prisma.pinToPrisma6: true`.
- Node 20 (per Dockerfile and CI). npm 9+. TypeScript 5.9.
