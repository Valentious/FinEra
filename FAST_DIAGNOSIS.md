# FinEra – Fast Diagnosis (2 minutes)

> **FinEra uses port 4000** (not 5000). Routes use `/api/v1/`.

---

## Step 1: Test backend directly

Open in browser:

```
http://localhost:4000/health
```

| Result | Meaning |
|--------|---------|
| JSON like `{"status":"ok"}` | Backend is running → go to Step 2 |
| Page doesn’t load / refused | Backend is not running |

**Fix:** Start backend:

```powershell
cd backend-core
npm run dev
```

---

## Step 2: Check port

Backend terminal should show:

```
Server running on port 4000
```

Frontend must call:

```
http://localhost:4000/api/v1/...
```

**Fix:** In `.env` (project root):

```
VITE_API_URL=http://localhost:4000/api/v1
```

---

## Step 3: Verify HTTP (not HTTPS)

Frontend and backend should both use HTTP in dev:

- Frontend: `http://localhost:5173` (or 5174)
- Backend: `http://localhost:4000`

---

## Step 4: Confirm backend routes

| Endpoint | Method |
|----------|--------|
| `/api/v1/auth/register` | POST |
| `/api/v1/auth/login` | POST |
| `/api/v1/reference/registration-data` | GET |

---

## Step 5: CORS

Backend already uses CORS with:

- `http://localhost:5173`, `5174`, `5175`, `3000`
- `http://127.0.0.1:5173`, etc.

---

## Step 6: Check DevTools console

In browser: Inspect → Console + Network

| Error | Meaning |
|-------|---------|
| `ERR_CONNECTION_REFUSED` | Backend not running |
| CORS error | Origin not allowed |
| 404 | Wrong URL or route |
| `Failed to fetch` | Wrong port or backend down |

---

## Most likely causes

1. Backend not running
2. Wrong port (4000 vs 5000)
3. Wrong base URL (must use `/api/v1/` prefix)

---

## Quick fix

1. Start backend: `cd backend-core && npm run dev`
2. Refresh frontend
3. Ensure `.env` has `VITE_API_URL=http://localhost:4000/api/v1`
