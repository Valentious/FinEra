# Docker and admin operations

**Yes - you can run the admin UI and API through Docker.** The admin app is the same Vite SPA (`/admin` routes); the API is `backend-core`.

## Single port (recommended): no extra host ports for API/DB

`docker-compose.yml` publishes **only `8080`** (nginx). The browser talks to **one origin**:

- **Member app:** `http://localhost:8080`
- **Admin:** `http://localhost:8080/admin`

Nginx proxies **`/api`** and **`/ws`** to the **backend** container. Postgres and RabbitMQ are **not** exposed on the host (internal Docker network only). The backend is **not** published on `4000` by default.

```bash
docker compose up -d --build
```

Build uses **`VITE_API_URL=/api/v1`** so the SPA calls **`/api/v1/...`** on the same host (through nginx).

## What runs in Docker

| Piece | Role |
|--------|------|
| **frontend** (nginx) | Static SPA + reverse proxy to API/WebSocket. |
| **backend** | API on `:4000` **inside** the compose network only. |
| **postgres / rabbitmq** | Internal only (`expose`, no `ports` on host). |

## Commands (legacy / dev compose)

Older docs referred to **5173** + **4000** separately. For **multi-port dev with hot reload**, use **`docker-compose.dev.yml`** or local **`npm run dev`**.

**Dev stack with hot reload** (optional):

```bash
docker compose -f docker-compose.dev.yml up --build
# or: npm run dev:docker
```

See `docker-compose.dev.yml` for ports (typically **5173** for Vite, **4000** for API).

## Not “crushing” the machine

- **Docker Desktop** (Windows): set **CPU / memory** limits in Settings → Resources if the host is small.
- **Don’t** expose Postgres (`5432`) or Redis to the public internet in production.
- Start with **only what you need** (e.g. Postgres + backend + frontend; add RabbitMQ when you need the event bus).
- Keep **one** backend listener on **4000**; duplicate processes or stale containers cause confusing port conflicts.

## Monitoring users

Today, the admin **dashboard** (`DashboardHome`) calls:

- `GET /api/v1/admin/overview` - aggregates (total users, active loans, risk distribution, fraud flags).
- `GET /api/v1/admin/activity` - recent domain events.

The **Users** sidebar entry is still a **placeholder**; a full “user directory” screen would list/search `User` rows via new admin endpoints (RBAC + audit). The **overview** metrics already reflect **user counts** from the database for monitoring.

## Environment notes

- **`VITE_API_URL`**: For the **default** `docker compose` stack, set **`/api/v1`** (same origin through nginx). For local dev without Docker, use your API origin, e.g. `http://localhost:4000` (the app normalizes `/api/v1` so you do not double the path).
- **`FRONTEND_URL`** in `backend-core` must match the URL you use in the browser (CORS + cookies). With the single-port compose file, use **`http://localhost:8080`**. For Vite-only dev, **`http://localhost:5173`** (or your Vite port).

## When Docker is not required

Local **`npm run dev`** (Vite + `backend-core`) is fine for admin work; Docker is optional for consistency with deployment or team onboarding.
