# FinEra Inclusive Credit - Full-Stack Architecture

## System Objective

Strict full-stack architecture where:
- **Frontend** fetches data, displays it, sends user actions (no financial logic)
- **Backend** is the single source of truth for all financial operations
- **Database** enforces ACID transactions for money flows
- **Auto-sync** keeps frontend in sync with backend
- **Auto-run** starts the entire stack with one command

---

## 1. Frontend → Backend Migration

### Financial Operations (Backend-Controlled)
| Operation | API Endpoint | Frontend Action |
|-----------|--------------|-----------------|
| Deposit | `POST /api/v1/wallet/deposit` | `apiService.depositFunds()` → `refreshUserData()` |
| Withdraw | `POST /api/v1/wallet/withdraw` | `apiService.withdrawFunds()` → `refreshUserData()` |
| Transfer Credit→Savings | `POST /api/v1/wallet/transfer-credit-to-savings` | `apiService.transferCreditToSavings()` |
| Loan Repayment | `POST /api/v1/wallet/repay` | `apiService.makeRepayment()` |
| Get Balance | `GET /api/v1/wallet/balance` | Via `getUserProfile()` |
| Get Transactions | `GET /api/v1/wallet/transactions` | `apiService.getTransactions()` |
| Get Portfolio | `GET /api/v1/wallet/portfolio` | Via `getPortfolioSummary()` |

### Frontend Rules
- ❌ No `balance = deposits - withdrawals` (calculated client-side)
- ✅ `const balance = await api.getWalletBalance(userId)`
- All financial state comes from API responses

---

## 2. Backend Services

### Wallet Service (`backend-core/src/modules/wallet/wallet.service.ts`)
- Input validation (Zod)
- Balance calculations
- `ensureWallet()`, `getWalletOrThrow()`, `validateSufficientBalance()`

### Transaction Service (`backend-core/src/modules/wallet/transaction.service.ts`)
- **All updates use `prisma.$transaction()`** - atomic, auto-ROLLBACK on failure
- `processDeposit()`, `processWithdrawal()`, `processTransferCreditToSavings()`
- `processLoanDisbursement()`, `processLoanRepayment()`
- `listTransactions()` with pagination

### Portfolio Service (`backend-core/src/modules/wallet/portfolio.service.ts`)
- Portfolio summary from wallet + transaction history
- Growth %, net deposits, interest

---

## 3. Database Enforcement (PostgreSQL)

### Schema
- `users`, `wallets`, `transactions`, `loans`, `repayments`, `CreditProfile`
- `Wallet.approvedCreditBalance`, `savingsBalance`, `activeLoanBalance`
- Foreign keys, NOT NULL, UNIQUE where needed
- Decimal(18,8) for all monetary values

### Transaction Wrapping
```sql
-- Concept (Prisma handles this)
BEGIN;
  UPDATE wallets SET savingsBalance = savingsBalance + 100 WHERE ...;
  INSERT INTO transactions (...) VALUES (...);
COMMIT;  -- or ROLLBACK on any error
```

---

## 4. Auto-Sync

- **On user action**: API call → `refreshUserData()` → UI updates
- **Periodic refresh**: Dashboard polls `getUserProfile()` + `getTransactions()` every 60s (when `USE_MOCK_DATA=false`)
- Future: WebSockets or Supabase realtime for push-based updates

---

## 5. Auto-Run System

### Development
```bash
npm run dev
```
Runs `concurrently` → frontend (Vite) + backend (backend-core)

### Docker (Full Stack)
```bash
npm run docker:up
```
Starts: `postgres` (5432), `backend` (4000), `frontend` (5173→80)

### Health Check
```bash
npm run health
```
Calls `http://localhost:4000/health` - exit 0 if OK, 1 if down

### Backend Endpoints
- `/health` - liveness
- `/ready` - DB connected (SELECT 1)

---

## 6. Validation & Fail-Safe

### Backend
- Zod validates every request body/query
- `validationError()` throws on invalid input
- Global `errorHandler` middleware

### Frontend
- `apiCall()` retries 3x on network failure
- `checkBackendHealth()` - shows `BackendUnavailableBanner` when backend down
- `USE_MOCK_DATA=true` - fallback to mock data when backend unavailable

---

## 7. Configuration

### Production (Real Backend)
1. Set `USE_MOCK_DATA = false` in `src/services/index.ts`
2. Ensure `VITE_API_URL` points to backend (e.g. `http://localhost:4000/api/v1`)
3. Start backend: `cd backend-core && npm run dev` or use `npm run dev`

### Mock Mode (Development without Backend)
- `USE_MOCK_DATA = true` - uses `mockApi` (local state)
- Logs: `[FinEra] Using mock data (USE_MOCK_DATA=true)`

---

## 8. File Structure

```
FinEra Inclusive Credit/
├── docker-compose.yml      # postgres, backend, frontend
├── Dockerfile.frontend
├── nginx.conf
├── package.json            # dev, docker:up, health scripts
├── scripts/
│   └── check-health.js
├── src/                    # Frontend (Vite + React)
│   ├── app/App.tsx         # Screen routing, refreshUserData
│   ├── services/
│   │   ├── api.ts         # All API calls
│   │   ├── index.ts       # USE_MOCK_DATA switcher
│   │   └── mockApi.ts    # Mock for dev
└── backend-core/
    ├── Dockerfile
    ├── prisma/schema.prisma
    └── src/
        ├── app.ts
        ├── server.ts
        ├── modules/
        │   ├── wallet/
        │   │   ├── wallet.service.ts
        │   │   ├── transaction.service.ts
        │   │   ├── portfolio.service.ts
        │   │   └── wallet.routes.ts
        │   ├── auth/
        │   ├── credit/
        │   └── ...
```

---

## 9. Enforcement Checklist

- [x] No frontend financial logic (use API)
- [x] Backend = single source of truth
- [x] DB transactions for all money updates
- [x] Zod validation on API
- [x] Auto-run (`npm run dev`, `docker-compose up`)
- [x] Health checks
- [x] Fail-safe (retry, mock fallback, banner)
