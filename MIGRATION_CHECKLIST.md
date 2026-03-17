# Backend Migration Checklist

## Quick Reference: Switch from Mock to Real Backend

---

## Step-by-Step Migration

### ✅ Step 1: Configure Environment
```bash
# Create .env file
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env

# Or for production:
# REACT_APP_API_URL=https://api.inclusivecredit.com/api
```

### ✅ Step 2: Switch to Real API

**File:** `/src/services/index.ts`

Change line 9:
```typescript
// Before (Mock Mode)
export const USE_MOCK_DATA = true;

// After (Real Backend)
export const USE_MOCK_DATA = false;
```

### ✅ Step 3: Verify Backend URL

**File:** `/src/services/api.ts`

Check line 17:
```typescript
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
```

Ensure this matches your backend URL.

---

## What Gets Removed Automatically

When `USE_MOCK_DATA = false`, the following are automatically bypassed:

### ❌ No Longer Used:
- `/src/services/mockApi.ts` - Mock responses
- `localStorage` operations (except auth token)
- Frontend calculations (generateMemberId, calculateActiveCredit, etc.)
- Local transaction storage

### ✅ Used Instead:
- `/src/services/api.ts` - Real API calls
- Backend JWT tokens
- Backend calculations
- Database persistence

---

## Code That Can Be Safely Removed (Optional)

### In `/src/app/App.tsx`

You can remove these functions (lines 74-106) after confirming backend works:

```typescript
// ==================== MOCK DATA HELPERS ====================
// TODO: Remove these when connecting to real backend
function generateMemberId(): string { ... }
function generateAccountNumber(): string { ... }
function calculateActiveCredit(principal: number): number { ... }
const saveUserData = (data: UserData) => { ... };
const loadUserData = (email: string): UserData | null => { ... };
// ==================== END MOCK DATA HELPERS ====================
```

**⚠️ Warning:** Only remove after thorough testing with real backend!

---

## Testing the Migration

### 1. Start Backend Server
```bash
cd backend
npm run dev
# Should see: Server running on http://localhost:3001
```

### 2. Test API Endpoints

Using curl or Postman:

```bash
# Health check
curl http://localhost:3001/api/health

# Register test user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phoneNumber": "+263771234567",
    "email": "test@example.com",
    "password": "Test123!",
    "accountType": "student"
  }'
```

### 3. Start Frontend
```bash
npm start
```

### 4. Test User Flow
1. ✅ Register new user
2. ✅ Verify OTP
3. ✅ Complete profile
4. ✅ Login
5. ✅ View dashboard
6. ✅ Deposit funds
7. ✅ Apply for credit
8. ✅ Make repayment

### 5. Check Browser Console
Look for:
- ✅ Successful API calls (200 status)
- ✅ Proper error handling (4xx, 5xx status)
- ❌ No CORS errors
- ❌ No authentication errors

### 6. Check Backend Logs
Verify:
- ✅ Incoming requests logged
- ✅ Database queries executed
- ✅ Responses sent
- ❌ No unhandled errors

---

## Common Migration Issues

### Issue 1: CORS Error
```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution:**
Backend must enable CORS:
```javascript
// backend/server.js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',  // or your frontend URL
  credentials: true
}));
```

---

### Issue 2: 401 Unauthorized
```
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

**Solution:**
- Check JWT token is being sent in Authorization header
- Verify JWT_SECRET matches between frontend token and backend
- Check token expiry (24 hours)

---

### Issue 3: Network Request Failed
```
TypeError: Failed to fetch
```

**Solution:**
- Ensure backend server is running
- Check BASE_URL in `/src/services/api.ts`
- Verify network connectivity
- Check firewall settings

---

### Issue 4: Data Type Mismatch
```
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input"
  }
}
```

**Solution:**
- Check request body format matches backend expectations
- Verify all required fields are sent
- Check data types (string vs number)

---

### Issue 5: Payment Gateway Error
```
{
  "success": false,
  "error": {
    "code": "PAYMENT_GATEWAY_ERROR",
    "message": "Payment processing failed"
  }
}
```

**Solution:**
- Verify payment gateway credentials in backend .env
- Check API keys are valid
- Test gateway in sandbox mode first
- Implement retry logic

---

## Rollback Plan

If migration fails, quickly rollback:

### Option 1: Switch Back to Mock
```typescript
// /src/services/index.ts
export const USE_MOCK_DATA = true;  // Back to mock mode
```

### Option 2: Use Previous Commit
```bash
git log  # Find last working commit
git checkout <commit-hash>
```

### Option 3: Environment Variable Override
```bash
# .env
REACT_APP_USE_MOCK=true
```

Then update `/src/services/index.ts`:
```typescript
export const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK === 'true';
```

---

## Production Deployment Checklist

### Frontend
- [ ] Set `USE_MOCK_DATA = false`
- [ ] Update REACT_APP_API_URL to production backend
- [ ] Build production bundle: `npm run build`
- [ ] Test built files locally
- [ ] Deploy to hosting (Vercel, Netlify, etc.)
- [ ] Verify HTTPS is enabled
- [ ] Test on live URL

### Backend
- [ ] Set `NODE_ENV=production`
- [ ] Use production database
- [ ] Enable SSL/TLS
- [ ] Set strong JWT_SECRET
- [ ] Configure real payment gateways (not sandbox)
- [ ] Set up email/SMS services
- [ ] Enable rate limiting
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure logging
- [ ] Set up database backups
- [ ] Run database migrations
- [ ] Test all endpoints
- [ ] Monitor server resources

### Security
- [ ] All passwords hashed (bcrypt)
- [ ] JWT tokens properly validated
- [ ] CORS configured correctly
- [ ] Input validation enabled
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting active
- [ ] Secrets in environment variables (not hardcoded)
- [ ] HTTPS only in production

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Payment flow tested
- [ ] Error scenarios tested
- [ ] Mobile responsiveness verified

---

## Monitoring After Migration

### Key Metrics to Watch

1. **API Response Times**
   - Target: < 500ms for most endpoints
   - Alert if > 2000ms

2. **Error Rates**
   - Target: < 1% error rate
   - Alert if > 5%

3. **Payment Success Rate**
   - Target: > 95% success
   - Alert if < 90%

4. **Database Query Times**
   - Target: < 100ms for simple queries
   - Alert if > 1000ms

5. **User Registration Flow**
   - Track completion rate
   - Identify drop-off points

### Logging

Enable detailed logging for:
- All API requests/responses
- Authentication attempts (success/failure)
- Payment transactions
- Score calculations
- Error stack traces
- Database queries (in development)

### Alerting

Set up alerts for:
- Server downtime
- High error rates
- Payment gateway failures
- Database connection issues
- Slow response times
- Security events (failed login attempts, etc.)

---

## Support Resources

- **API Documentation:** `/BACKEND_API_SPECIFICATION.md`
- **Business Logic:** `/BUSINESS_LOGIC_CALCULATIONS.md`
- **Integration Guide:** `/README_BACKEND_INTEGRATION.md`
- **Frontend Code:** `/src/services/api.ts`
- **Mock Code:** `/src/services/mockApi.ts`

---

## Final Checklist

Before going live:

- [ ] Mock mode disabled (`USE_MOCK_DATA = false`)
- [ ] Backend URL configured correctly
- [ ] All endpoints tested
- [ ] Payment gateways integrated
- [ ] Email/SMS services working
- [ ] Database properly configured
- [ ] Security measures in place
- [ ] Error handling tested
- [ ] Monitoring enabled
- [ ] Backup system ready
- [ ] Documentation updated
- [ ] Team trained on new system

---

**Migration Status:** 🟡 Pending

**Last Updated:** March 13, 2026  
**Version:** 1.0.0

---

## Quick Commands

```bash
# Check current mode
grep "USE_MOCK_DATA" src/services/index.ts

# Switch to real backend
sed -i 's/USE_MOCK_DATA = true/USE_MOCK_DATA = false/' src/services/index.ts

# Switch to mock backend
sed -i 's/USE_MOCK_DATA = false/USE_MOCK_DATA = true/' src/services/index.ts

# Test backend connection
curl http://localhost:3001/api/health

# Build for production
npm run build

# Test production build locally
npx serve -s build
```
