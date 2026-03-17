# Backend Integration Guide

## Overview

This frontend is **ready for backend integration**. All business logic, calculations, and data persistence have been abstracted into an API service layer.

## Current Setup

The application is currently running in **MOCK MODE** using `localStorage` to simulate backend responses. This allows full frontend functionality without a backend.

---

## Switching to Real Backend

### Step 1: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:3001/api
# Or use your production backend URL
# REACT_APP_API_URL=https://api.inclusivecredit.com/api
```

### Step 2: Turn Off Mock Mode

Open `/src/services/index.ts` and change:

```typescript
export const USE_MOCK_DATA = true;
```

To:

```typescript
export const USE_MOCK_DATA = false;
```

### Step 3: Verify Backend is Running

Ensure your backend server is running and accessible at the URL specified in `.env`.

### Step 4: Test the Connection

1. Start the frontend: `npm start`
2. Try registering a new user
3. Check browser console for API calls
4. Check backend logs for incoming requests

---

## API Service Architecture

### File Structure

```
src/services/
├── api.ts          # Real API calls (fetch-based)
├── mockApi.ts      # Mock responses (localStorage-based)
└── index.ts        # Service selector (switches between mock/real)
```

### How It Works

1. **index.ts** checks `USE_MOCK_DATA` flag
2. If `true` → uses `mockApi.ts` (development)
3. If `false` → uses `api.ts` (production)

All components import from `@/services/index`, so switching is seamless.

---

## What the Backend Needs to Do

### 1. Authentication & User Management

The backend must handle:
- Password hashing (bcrypt recommended, 10+ rounds)
- JWT token generation (24-hour expiry)
- OTP generation and validation
- Session management
- Member ID generation (format: MEM12345678)
- Account number generation (12-digit unique number)

### 2. Financial Calculations

**CRITICAL**: The backend must implement these calculations:

```javascript
// Credit Limit (based on account type)
const CREDIT_LIMITS = {
  student: { min: 20, max: 200 },
  staff: { min: 30, max: 2000 },
  alumni: { min: 30, max: 2000 }
};

// Loan Amount Calculation
const serviceFee = principal * 0.015;  // 1.5%
const interest = principal * 0.18;     // 18%
const totalCredit = principal + serviceFee + interest;

// Available Savings (20% locked if loan active)
const lockedSavings = activeCredit > 0 ? savingsBalance * 0.20 : 0;
const availableSavings = savingsBalance - lockedSavings;

// Discipline Score (0-100)
// - Savings consistency: 30%
// - On-time payments: 40%
// - Savings-to-credit ratio: 20%
// - Account activity: 10%

// Credit Score (0-100)
// - Payment history: 50%
// - Credit utilization: 20%
// - Account age: 15%
// - Loyalty progress: 15%
```

### 3. Business Rules

**Loan Eligibility:**
- User must NOT have active loan
- Emergency loans: NO savings requirement
- Essential/Business loans: Savings must be ≥ 20% of loan amount

**Savings Lock:**
- When loan is active: 20% of savings is locked (cannot withdraw)
- When loan is repaid: Unlock savings

**Score Updates:**
- On-time payment: +1 to discipline score, +1 to credit score
- Loan fully repaid: +5 to discipline score, +3 to credit score
- Missed payment: +1 to missedPayments, -5 to credit score
- Loan cycle completed: +1 to loyaltyProgress

### 4. Payment Gateway Integration

The backend must integrate with:
- **Ecocash** (for deposits/withdrawals)
- **InnBucks** (for deposits/withdrawals)
- **OneMoney** (for deposits/withdrawals)
- **Bank Transfers**
- **Mobile Money**

Each withdrawal/deposit must:
1. Call payment gateway API
2. Wait for confirmation
3. Only update database after successful payment
4. Handle webhook callbacks from payment providers

---

## API Endpoints Required

See `/BACKEND_API_SPECIFICATION.md` for complete API documentation.

**Key Endpoints:**

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/verify-otp` - Verify OTP
- `GET /users/profile` - Get user data
- `POST /wallet/deposit` - Deposit funds
- `POST /wallet/withdraw` - Withdraw funds
- `POST /credit/apply` - Apply for loan
- `POST /repayment/make-payment` - Make repayment
- `GET /metrics/financial-identity` - Get scores
- `GET /admin/overview` - Admin dashboard (staff only)

---

## Database Schema

See `/BACKEND_API_SPECIFICATION.md` for complete schema.

**Core Tables:**
- `users` - User accounts and financial data
- `transactions` - All financial transactions
- `credit_applications` - Loan applications
- `loans` - Active and completed loans
- `repayment_schedule` - Payment schedule tracking
- `otp_verifications` - OTP codes for verification

---

## Testing the Backend

### Using Postman/Insomnia

1. **Register User:**
```
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "fullName": "Test User",
  "phoneNumber": "+263771234567",
  "email": "test@example.com",
  "password": "Test123!",
  "accountType": "student"
}
```

2. **Verify OTP:**
```
POST http://localhost:3001/api/auth/verify-otp
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456"
}
```

3. **Login:**
```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!"
}
```

4. **Get Profile** (requires token):
```
GET http://localhost:3001/api/users/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Error Handling

The frontend expects errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_SAVINGS",
    "message": "You need at least $200 in savings to apply for this loan",
    "details": {}
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid input
- `UNAUTHORIZED` - Invalid/expired token
- `INSUFFICIENT_BALANCE` - Not enough funds
- `INSUFFICIENT_SAVINGS` - Savings requirement not met
- `ACTIVE_LOAN_EXISTS` - User already has active loan
- `CREDIT_LIMIT_EXCEEDED` - Requested amount exceeds limit
- `PAYMENT_GATEWAY_ERROR` - Payment processing failed
- `NOT_FOUND` - Resource not found
- `SERVER_ERROR` - Internal server error

---

## Security Checklist

### Backend Security:
- [ ] Hash all passwords (bcrypt, 10+ rounds)
- [ ] Validate all inputs (sanitize, type check)
- [ ] Use prepared statements (prevent SQL injection)
- [ ] Implement rate limiting on auth endpoints
- [ ] Validate JWT tokens on every protected route
- [ ] Use HTTPS in production
- [ ] Set proper CORS headers
- [ ] Never expose sensitive data in responses
- [ ] Log all security events
- [ ] Implement CSP headers

### Frontend Security:
- [x] No sensitive data in localStorage (only user ID)
- [x] API calls use Authorization header
- [x] No hardcoded credentials
- [x] Input validation on forms
- [x] HTTPS-only cookies (when backend ready)

---

## Development Workflow

### With Mock Data (Current):
```bash
npm start
# Frontend works independently
# All data stored in localStorage
```

### With Real Backend:
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm start
```

---

## Production Deployment

### Environment Variables

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://api.inclusivecredit.com/api
```

**Backend (.env.production):**
```env
NODE_ENV=production
PORT=3001
DB_HOST=your_db_host
DB_PASSWORD=your_db_password
JWT_SECRET=your_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_USER=noreply@inclusivecredit.com
ECOCASH_API_KEY=your_key
```

### Build Frontend
```bash
npm run build
# Deploy 'build' folder to hosting (Vercel, Netlify, etc.)
```

### Deploy Backend
```bash
# Deploy to your server (Heroku, AWS, DigitalOcean, etc.)
# Ensure database migrations run
# Set up SSL certificates
# Configure firewall
```

---

## Common Issues & Solutions

### Issue: CORS Error
**Solution:** Backend must set proper CORS headers:
```javascript
app.use(cors({
  origin: 'https://yourfrontend.com',
  credentials: true
}));
```

### Issue: 401 Unauthorized
**Solution:** Check JWT token expiry and refresh logic

### Issue: Payment Gateway Timeout
**Solution:** Implement retry logic and webhook handlers

### Issue: Database Connection Failed
**Solution:** Check DB credentials and firewall rules

---

## Next Steps

1. ✅ Frontend is ready
2. ⏳ Backend development needed
3. ⏳ Database setup required
4. ⏳ Payment gateway integration
5. ⏳ Email/SMS service setup
6. ⏳ Testing & QA
7. ⏳ Production deployment

---

## Support

For backend development questions:
- See `/BACKEND_API_SPECIFICATION.md` for complete API docs
- Check `src/services/api.ts` for expected request/response formats
- Look at `src/services/mockApi.ts` to see expected behavior

---

**Last Updated:** March 13, 2026  
**Frontend Version:** 2.0.0 (Backend-Ready)
