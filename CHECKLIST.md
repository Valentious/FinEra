# FinEra System Verification Checklist

## Backend Status
- [ ] PostgreSQL is running (port 5432)
- [ ] Backend server is running on port 4000 (`curl http://localhost:4000/health`)
- [ ] Database schema applied (`npx prisma db push`)
- [ ] Environment variables set in `.env`

## API Endpoints Tested
- [ ] `GET /health` - Returns 200
- [ ] `POST /auth/register` - Creates user successfully
- [ ] `POST /auth/login` - Returns JWT tokens
- [ ] `GET /user/profile` - Returns user data (with auth)
- [ ] `GET /user/wallets` - Returns wallets (with auth)
- [ ] `POST /transactions/deposit` - Creates deposit
- [ ] `POST /transactions/withdraw` - Creates withdrawal
- [ ] `GET /transactions` - Returns history
- [ ] `GET /credit/score` - Returns credit score
- [ ] `GET /credit/limit` - Returns credit limit
- [ ] `POST /credit/apply` - Creates loan application
- [ ] `POST /kyc/upload` - Uploads documents
- [ ] `GET /notifications` - Returns notifications

## Frontend Integration
- [ ] Frontend running (if applicable)
- [ ] `VITE_API_URL` set to `http://localhost:4000/api/v1`
- [ ] CORS properly configured (FRONTEND_URL in backend .env)
- [ ] Authentication flow works (login → dashboard)
- [ ] Wallet balances display correctly
- [ ] Transaction history loads
- [ ] Credit score displays

## Database Operations Verified
- [ ] Can create user
- [ ] Can create wallets
- [ ] Can create transactions
- [ ] Can create loans
- [ ] Can create repayments
- [ ] Can create notifications
- [ ] All relationships work
- [ ] Data persists after restart

## Security Checks
- [ ] Passwords hashed with bcrypt
- [ ] JWT authentication working
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] Environment variables not exposed

## Quick Commands
```bash
# Start backend
cd backend-core && npm run dev

# Verify database
cd backend-core && npx tsx src/test/verify-database.ts

# Run integration tests
cd backend-core && powershell -File scripts/test-full-stack.ps1
```

## Seed User
- **Email:** test@university.edu
- **Password:** TestPassword123!
