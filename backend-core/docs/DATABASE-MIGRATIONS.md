# Database migrations (Option B - keep data, fix history)

## Why `migrate dev` / shadow DB fails

The folder `prisma/migrations/` only contains **small follow-up migrations** (e.g. `ALTER TABLE "Ledger" ...`). There is **no initial migration** that creates `Ledger`, `User`, `AdminUser`, etc.

Prisma Migrate works like this:

1. It creates an **empty shadow database**.
2. It applies **every migration in order** from scratch.
3. The first migration alters `"Ledger"` → **Ledger does not exist** → **P1014**.

Your real database was almost certainly created with **`prisma db push`** (or manual SQL), so the **live DB** and **`schema.prisma`** match, but the **migration history does not describe a full create-from-empty path**.

---

## A. Keep existing data - baseline without re-running destructive SQL

Goal: make `_prisma_migrations` consistent with reality **without** dropping production tables.

### 1. Backup

```bash
# Example (adjust user/host/db)
pg_dump -h 127.0.0.1 -U finera -d finera_db -Fc -f finera_backup.dump
```

### 2. See drift between **live DB** and **current schema**

From `backend-core` (PowerShell):

```powershell
npx prisma migrate diff --from-url $env:DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script
```

- If this prints **nothing** (or only harmless comments), the DB already matches `schema.prisma`.
- If it prints SQL, that is the **safe delta** you still need to apply (review carefully).

### 3. Baselining (official pattern)

Use Prisma’s **baselining** when the database already has the schema but migration history is incomplete:

[Developing with Prisma Migrate - Baselining](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining)

Summary:

1. Add a **single baseline migration** whose SQL matches how the DB was created (often generated once from `schema.prisma` for an **empty** DB - see section C).
2. On **production**, mark it as already applied if the DB was created outside Migrate:

```bash
npx prisma migrate resolve --applied "MIGRATION_FOLDER_NAME"
```

Never run destructive SQL on production just to “make Migrate happy”; **resolve** tells Prisma “this migration is already reflected in the database.”

### 4. Mark your existing incremental migrations (if their changes are already in the DB)

If `ALTER TABLE "Ledger" ...` was applied manually or via `db push`, you can mark those folders as applied without executing them again:

```bash
npx prisma migrate resolve --applied "20250327120000_add_custodian_omnibus_external_id"
# repeat for each migration that is already reflected in the DB
```

**Warning:** Only do this if you are sure the DB already matches what those files would do.

### 5. New changes after baseline

After history is fixed, use only:

```bash
npx prisma migrate dev --name describe_change
```

for local development, and in CI/production:

```bash
npx prisma migrate deploy
```

---

## B. Minimal “empty Postgres” checklist (new dev / new environment)

1. Create database and user; set `DATABASE_URL` in `backend-core/.env`.
2. Ensure migration history is valid: either **baseline + deploy** (recommended) or a **single initial migration** that creates the full schema from `schema.prisma` (see section C).
3. From `backend-core`:

```bash
npx prisma migrate deploy
npm run db:seed
```

4. Confirm:

```bash
npx prisma studio
# or
npm run test:db
```

---

## C. Generating a full SQL baseline from `schema.prisma` (for new empty DBs)

When you need **one migration** that creates everything (typical for fixing “no init migration”):

From `backend-core`:

```powershell
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init_baseline/migration.sql
```

Create the folder `prisma/migrations/0_init_baseline/` first, then run the command (adjust the path). **Review** the SQL; split or edit if needed.

- **New empty DB:** `migrate deploy` applies `0_init_baseline` and you’re done.
- **Existing DB that already matches schema:** mark as applied:

```bash
npx prisma migrate resolve --applied "0_init_baseline"
```

You may then **remove or archive** the old incremental-only migrations if they are fully superseded by the baseline - only do this after verifying diff vs production.

---

## D. Shadow database URL (optional, advanced)

If you use `shadowDatabaseUrl` in `schema.prisma`, it must point to a database Prisma can drop/recreate. Misconfiguration causes shadow failures. Prefer fixing migration history (above) over relying on shadow URL hacks.

---

## Admin prototype login (`ADMIN_PROTO_LOGIN`)

When `NODE_ENV=development` and `ADMIN_PROTO_LOGIN=true`, the API skips password verification for admin login. If the `AdminUser` table exists but has **no rows**, the first successful login **creates** `admin@finera.local` automatically (no `db:seed` required). If the **table itself** is missing, run migrations / `db push` first.

## Quick reference

| Situation | Command |
|-----------|---------|
| Drift check (DB → schema) | `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script` |
| Mark migration applied | `prisma migrate resolve --applied "folder_name"` |
| Apply pending migrations (CI/prod) | `prisma migrate deploy` |
| **Avoid** on prod if history is broken | `db push --accept-data-loss` without a backup |
