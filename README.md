# FinEra Inclusive Credit

Inclusive financial ecosystem for students, staff, and alumni: registration, multi-currency wallets, savings, credit flows, learning hub, and backend APIs.

**Upstream repository:** [github.com/Valentious/FinEra](https://github.com/Valentious/FinEra)

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, TypeScript, Tailwind CSS, Radix UI |
| Backend | Node.js, Express-style API (`backend-core`), Prisma ORM |
| Database | PostgreSQL (see `backend-core/prisma/schema.prisma`) |
| Dev | Concurrent frontend + backend, optional Docker (`docker-compose.dev.yml`) |

## Quick start

```powershell
npm install
npm run dev
```

- **Frontend:** http://localhost:5173  
- **Backend:** http://localhost:4000 (when started via `npm run dev` or `backend-core`)

One-command full stack (Postgres + Redis + API + Vite):

```powershell
npm run dev:docker
```

## Documentation

| Document | Purpose |
| --- | --- |
| [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) | **Current system state:** what was removed, auth/onboarding flow, gaps, dev flags (OTP bypass, mock API) |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Environment variables, DB, ports, manual vs Docker |
| [CHECKLIST.md](./CHECKLIST.md) | Backend health, API smoke tests, integration checks |
| [BACKEND_API_SPECIFICATION.md](./BACKEND_API_SPECIFICATION.md) | API contract |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview |

## Project layout

```
├── src/                 # React app (screens, components, services)
├── backend-core/        # API server, Prisma, tests
├── finera-system/       # Additional system assets / infra notes
├── docker-compose*.yml  # Local / dev orchestration
└── docs/                # Architecture and status docs
```

## Product status (summary)

See **[docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)** for removals (e.g. USDT, old email-OTP-before-register), the current **register → verify-email → login** flow, and known gaps vs production.

## Production build

```powershell
npm run build
```

Output is written to `dist/`.

## License

Private project; see repository settings on GitHub.
