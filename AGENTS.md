# UniConnect Backend — Agent Guide

## Quick start

```bash
cp .env_ejemplo .env   # edit real values
npm install
npx prisma generate
npx prisma db push      # sync Prisma schema to MongoDB
npm run dev             # nodemon on src/server.ts
```

## Architecture

Hexagonal (ports & adapters) with DDD-lite. Every module under `src/modules/<name>/` has:

```
domain/             interfaces & types (ports)
application/        use-case classes (pure business logic)
infrastructure/     Prisma repos, gateways, adapters
interfaces/http/    Express routes + controllers (thin)
```

Wiring: `src/container.ts` — single DI container instantiating all repos, services, and use cases.

Shared contracts: `src/domain/contracts.ts` (re-exported per-module).

## Key commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with nodemon |
| `npm run build` | `generate:openapi && tsc` |
| `npm test` | All Jest tests (`*.test.ts`) |
| `npm test -- tests/integration --verbose` | Integration tests only |
| `npx tsc --noEmit` | Type-check without emitting |
| `npm run generate:openapi` | Regenerate `openapi.json` from JSDoc |

CI runs: `npx prisma generate` → `npx tsc --noEmit` → `npm run build` → `npm test -- --coverage --verbose`.

No linter or formatter is configured.

## Testing quirks

- Prisma is **mocked globally** in `tests/setup/jest.setup.ts` — unit tests don't need a real DB.
- Tests live alongside source (`src/**/*.test.ts`) and in `tests/`.
- Coverage reports to `coverage/`. **80% threshold** enforced on PRs to `main`.
- Integration tests in `tests/integration/` require `NODE_ENV=test`.

## Database

MongoDB via Prisma ORM. Schema: `prisma/schema.prisma`. Always run `npx prisma generate` after schema changes. Use `npx prisma db push` (not `prisma migrate`) for schema sync.

## Auth & real-time

- JWT auth via `Authorization: Bearer <token>` — middleware at `src/middleware/autenticacion.middleware.ts`.
- `DEV_MODE=true` skips Google OAuth validation (dev only).
- Token revocation is **in-memory** (lost on restart).
- Socket.IO on the same port, auth via `socket.handshake.auth.token`. Room naming: `usuario:<id>`, `grupo:<id>`.
- Socket event types defined in `src/lib/socket.ts`.

## API docs

- OpenAPI 3 spec generated from JSDoc in `src/modules/**/interfaces/http/*.routes.ts`.
- Swagger UI: `http://localhost:3000/docs`. Raw spec: `GET /openapi.json`.
- Schemas in `src/docs/swagger.ts`.

## Module notes

| Prefix | Module |
|---|---|
| `/api/usuarios` | users |
| `/api/materias` | materias |
| `/api/grupos` | groups |
| `/api/mensajes` | messages |
| `/api/eventos` | events |
| `/api/catalogos` | catalog |
| `/api/notificaciones` | notifications |
| `/api/foro` | foro |
| `/api/sesiones` | sesiones (study sessions) |
| `/api/encuestas` | polls |
| `/api/recursos` | recursos (resources) |
| `/api/scrum` | scrum module |

## Deploy

- Docker multi-stage build (`Dockerfile`), deployed to Fly.io.
- Health check: `GET /health` returns `{ status, version, commit }`.
- CI auto-rollbacks on failed health checks after deploy.
- Fly.io secrets: `FLY_API_TOKEN`, `SLACK_WEBHOOK_URL` (set as GitHub Actions secrets).

## PR conventions

- Title must match: `type(scope): description` — types: `feat|fix|docs|style|refactor|test|chore|perf|ci|build`.
- Coverage must stay ≥ 80%.
- Default branch: `developer`. PRs to `main` from `developer`.
