# FinEra Admin Dashboard (bounded context)

This folder is the **only** place for staff UI: institutional oversight, ledger monitoring, FVAR (FinEra Verified Agent Registry), risk, and audit.

**Rules**

- No member (user) product flows here - those stay under `src/app/`.
- All numbers come from **REST** (`/api/v1/admin/*`, `/api/v1/ledger/*`); WebSocket is for **push only**, not source of truth.
- Currency context (USD / ZiG / ZAR) is always explicit via `CurrencyTag` + store.
- Design tokens live in `design-system/tokens.ts` - meaning-based colours, not decoration.

**Entry:** `main.tsx` mounts `<Route path="/admin/*" element={<AdminApp />} />`.
