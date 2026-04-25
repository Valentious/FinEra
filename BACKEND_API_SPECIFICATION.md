# Backend API Specification
## Inclusive Digital Credit Platform

This document outlines all backend endpoints required for the Inclusive Digital Credit Platform.

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User Management APIs](#user-management-apis)
3. [Wallet & Transaction APIs](#wallet--transaction-apis)
4. [Credit Application APIs](#credit-application-apis)
5. [Repayment APIs](#repayment-apis)
6. [Financial Metrics APIs](#financial-metrics-apis)
7. [Admin APIs](#admin-apis)
8. [Business Logic Requirements](#business-logic-requirements)
9. [Database Schema Suggestions](#database-schema-suggestions)

---

## Base URL
```
Production: https://api.inclusivecredit.com/api
Development: http://localhost:3001/api
```

## Authentication
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication APIs

### 1. Register User
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "+263771234567",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "accountType": "student" // or "staff" or "alumni"
}
```

**Backend Logic:**
1. Validate input data
2. Check if email/phone already exists
3. Hash password (use bcrypt)
4. Generate unique `memberId` (format: MEM12345678)
5. Generate unique `accountNumber` (12-digit number)
6. Calculate initial `creditLimit` based on accountType:
   - Student: max $200
   - Staff: max $2000
   - Alumni: max $2000
7. Send OTP to email/phone
8. Create user record with status "pending_verification"
9. Return user object (without password)

**Response:**
```json
{
  "user": {
    "memberId": "MEM12345678",
    "fullName": "John Doe",
    "phoneNumber": "+263771234567",
    "accountNumber": "173247856901",
    "email": "john@example.com",
    "accountType": "student",
    "savingsBalance": 0,
    "approvedCreditWallet": 0,
    "activeCredit": 0,
    "availableCreditLimit": 200,
    "loanPrincipal": 0,
    "disciplineScore": 75,
    "creditScore": 75,
    "loyaltyProgress": 0,
    "missedPayments": 0,
    "onTimePayments": 0
  },
  "message": "Registration successful. Please verify your OTP."
}
```

---

### 2. Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Backend Logic:**
1. Find user by email
2. Verify password hash
3. Check if account is verified
4. Generate JWT token (24-hour expiry)
5. Update lastLogin timestamp
6. Return user data and token

**Response:**
```json
{
  "user": { /* full user object */ },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Verify OTP
**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Backend Logic:**
1. Validate OTP
2. Check if OTP is expired (5-10 minutes validity)
3. Mark account as verified
4. Update user status to "active"

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

---

### 4. Resend OTP
**Endpoint:** `POST /auth/resend-otp`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully"
}
```

---

### 5. Logout
**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Backend Logic:**
1. Invalidate token (add to blacklist or use token versioning)

**Response:**
```json
{
  "success": true
}
```

---

## User Management APIs

### 6. Get User Profile
**Endpoint:** `GET /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Backend Logic:**
1. Extract user ID from JWT
2. Fetch user from database
3. Calculate real-time financial metrics (scores)
4. Fetch recent transactions
5. Return complete user data

**Response:**
```json
{
  "memberId": "MEM12345678",
  "fullName": "John Doe",
  "phoneNumber": "+263771234567",
  "accountNumber": "173247856901",
  "email": "john@example.com",
  "accountType": "student",
  "savingsBalance": 1500.00,
  "approvedCreditWallet": 0,
  "activeCredit": 0,
  "availableCreditLimit": 200,
  "loanPrincipal": 0,
  "transactions": [],
  "disciplineScore": 85,
  "creditScore": 82,
  "loyaltyProgress": 3,
  "missedPayments": 0,
  "onTimePayments": 12,
  "lastLogin": 1710345600000
}
```

---

### 7. Update User Profile
**Endpoint:** `PUT /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fullName": "John Updated Doe",
  "phoneNumber": "+263771234567",
  "idNumber": "12-345678-A-12"
}
```

**Response:**
```json
{
  /* updated user object */
}
```

---

### 8. Complete Profile (After Registration)
**Endpoint:** `POST /users/complete-profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "idNumber": "12-345678-A-12",
  "idBackImage": "base64_or_url",
  "address": "123 Main Street",
  "studentId": "S12345" // if student
}
```

**Response:**
```json
{
  "success": true,
  "user": { /* updated user object */ }
}
```

---

## Wallet & Transaction APIs

### 9. Deposit Funds
**Endpoint:** `POST /wallet/deposit`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 500.00,
  "method": "Ecocash", // or "Bank Transfer", "Mobile Money", etc.
  "purpose": "Savings Growth"
}
```

**Backend Logic:**
1. Validate amount > 0
2. **IMPORTANT:** Integrate with payment gateway to process payment
3. Verify payment success from gateway
4. Update user's `savingsBalance` += amount
5. Create transaction record
6. Recalculate `disciplineScore` based on savings consistency
7. Send confirmation notification

**Response:**
```json
{
  "transaction": {
    "id": "TXN1710345678901",
    "type": "deposit",
    "amount": 500.00,
    "date": "2026-03-13T10:30:00Z",
    "description": "Deposit via Ecocash - Savings Growth",
    "status": "completed"
  },
  "newBalance": 2000.00
}
```

---

### 10. Withdraw Funds
**Endpoint:** `POST /wallet/withdraw`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 300.00,
  "method": "Ecocash",
  "destination": "+263771234567" // phone number, wallet address, etc.
}
```

**Backend Logic:**
1. Validate amount > 0
2. Check if user has active loan:
   - If YES: only 80% of savings is withdrawable (20% locked as collateral)
   - If NO: 100% withdrawable
3. Validate sufficient available balance
4. **IMPORTANT:** Process withdrawal through payment gateway
5. Update `savingsBalance` -= amount
6. Create transaction record
7. Send confirmation notification

**Response:**
```json
{
  "transaction": {
    "id": "TXN1710345678902",
    "type": "withdrawal",
    "amount": 300.00,
    "date": "2026-03-13T11:00:00Z",
    "description": "Withdrawal via Ecocash",
    "status": "completed"
  },
  "newBalance": 1700.00
}
```

---

### 11. Transfer Credit to Savings
**Endpoint:** `POST /wallet/transfer-credit-to-savings`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 500.00
}
```

**Backend Logic:**
1. Validate amount <= `approvedCreditWallet`
2. Deduct from `approvedCreditWallet`
3. Add to `savingsBalance`
4. Create transaction record

**Response:**
```json
{
  "approvedCreditWallet": 500.00,
  "savingsBalance": 2200.00,
  "transaction": {
    "id": "TXN1710345678903",
    "type": "deposit",
    "amount": 500.00,
    "date": "2026-03-13T11:30:00Z",
    "description": "Transfer from Approved Credit to Savings",
    "status": "completed"
  }
}
```

---

### 12. Get Transactions
**Endpoint:** `GET /wallet/transactions`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): number of transactions (default 50)
- `offset` (optional): pagination offset (default 0)
- `type` (optional): filter by type (deposit, withdrawal, loan, repayment)

**Response:**
```json
[
  {
    "id": "TXN1710345678901",
    "type": "deposit",
    "amount": 500.00,
    "date": "2026-03-13T10:30:00Z",
    "description": "Deposit via Ecocash",
    "status": "completed"
  }
]
```

---

## Credit Application APIs

### 13. Apply for Credit
**Endpoint:** `POST /credit/apply`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "creditType": "essential", // or "emergency" or "business"
  "amount": 1000.00,
  "withCollateral": true,
  "collateralDetails": {
    "type": "Electronics",
    "description": "Laptop HP EliteBook",
    "estimatedValue": 1200.00,
    "images": ["url1", "url2"]
  }
}
```

**Backend Logic - CRITICAL BUSINESS RULES:**

1. **Eligibility Checks:**
   - User must not have active loan (`activeCredit` must be 0)
   - User account must be verified
   
2. **Savings Requirement (Financial Discipline Rule):**
   - For `essential` and `business` loans: user must have savings >= 20% of loan amount
   - For `emergency` loans: no savings requirement
   - **Formula:** `savingsBalance >= (amount * 0.20)`
   
3. **Credit Limit Validation:**
   - Amount must be within user's `availableCreditLimit`
   - Credit limits by account type:
     - Student: $20 - $200
     - Staff: $30 - $2000
     - Alumni: $30 - $2000
   
4. **Interest & Fee Calculation:**
   - Service Fee: 1.5% of principal
   - Interest Rate: 18% per annum
   - **Total Credit = Principal + (Principal × 0.015) + (Principal × 0.18)**
   - Example: $1000 loan = $1000 + $15 + $180 = $1195 total
   
5. **Approval Process:**
   - Auto-approve if all criteria met
   - Or queue for manual review if needed
   
6. **Upon Approval:**
   - Add principal to `approvedCreditWallet` (NOT directly withdrawable)
   - Set `activeCredit` = total credit amount
   - Set `loanPrincipal` = principal amount
   - Lock 20% of savings (if applicable)
   - Create loan transaction record
   - Generate repayment schedule
   - Send approval notification

**Response:**
```json
{
  "applicationId": "APP1710345678901",
  "status": "approved",
  "approvedAmount": 1000.00,
  "totalCredit": 1195.00,
  "message": "Loan approved successfully",
  "repaymentSchedule": {
    "totalAmount": 1195.00,
    "monthlyInstallment": 99.58,
    "repaymentCycle": "6 months",
    "firstDueDate": "2026-04-13"
  }
}
```

---

### 14. Get Credit Application Status
**Endpoint:** `GET /credit/application/:applicationId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "approved",
  "approvedAmount": 1000.00,
  "totalCredit": 1195.00,
  "message": "Your loan has been approved"
}
```

---

### 15. Get Credit Limits
**Endpoint:** `GET /credit/limits`

**Headers:** `Authorization: Bearer <token>`

**Backend Logic:**
1. Get user's account type
2. Return base limits
3. Calculate `availableCreditLimit` based on:
   - Account type
   - `disciplineScore`
   - `creditScore`
   - Loan history

**Response:**
```json
{
  "min": 20,
  "max": 200,
  "availableCreditLimit": 150
}
```

---

## Repayment APIs

### 16. Make Repayment
**Endpoint:** `POST /repayment/make-payment`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 100.00,
  "method": "savings" // or "mobile_money", "bank_transfer"
}
```

**Backend Logic - CRITICAL:**

1. **Validation:**
   - Amount must be > 0
   - Amount must be <= `activeCredit`
   - If method is "savings", validate `savingsBalance` >= amount
   
2. **Process Payment:**
   - If method is "savings": deduct from `savingsBalance`
   - If other method: process through payment gateway
   
3. **Update Loan:**
   - `activeCredit` -= amount
   - If `activeCredit` becomes 0:
     - Set `loanPrincipal` = 0
     - Unlock savings (remove 20% lock)
     - Increment `loyaltyProgress` (loan cycle completed)
     
4. **Update Metrics:**
   - Increment `onTimePayments` if paid on/before due date
   - Increment `missedPayments` if overdue
   - Recalculate `disciplineScore` (+5 if loan fully paid, +1 per payment)
   - Recalculate `creditScore` (+3 if loan fully paid, +1 per payment)
   
5. **Create Transaction Record**

6. **Send Confirmation Email**

**Response:**
```json
{
  "transaction": {
    "id": "TXN1710345678904",
    "type": "repayment",
    "amount": 100.00,
    "date": "2026-03-13T12:00:00Z",
    "description": "Repayment via savings",
    "status": "completed"
  },
  "remainingBalance": 1095.00,
  "loanFullyPaid": false,
  "updatedScores": {
    "disciplineScore": 86,
    "creditScore": 83
  }
}
```

---

### 17. Get Repayment Schedule
**Endpoint:** `GET /repayment/schedule`

**Headers:** `Authorization: Bearer <token>`

**Backend Logic:**
1. Get active loan details
2. Calculate monthly installments
3. Generate schedule with due dates
4. Mark past payments as "paid"
5. Mark overdue payments as "overdue"

**Response:**
```json
{
  "totalAmount": 1195.00,
  "amountPaid": 100.00,
  "remainingBalance": 1095.00,
  "monthlyInstallment": 99.58,
  "nextDueDate": "2026-04-13T00:00:00Z",
  "schedule": [
    {
      "dueDate": "2026-03-13T00:00:00Z",
      "amount": 99.58,
      "status": "paid"
    },
    {
      "dueDate": "2026-04-13T00:00:00Z",
      "amount": 99.58,
      "status": "pending"
    }
  ]
}
```

---

## Financial Metrics APIs

### 18. Get Financial Metrics
**Endpoint:** `GET /metrics/financial-identity`

**Headers:** `Authorization: Bearer <token>`

**Backend Logic - Score Calculation:**

**Discipline Score (0-100):**
- Savings consistency: 30%
- On-time payments: 40%
- Savings-to-credit ratio: 20%
- Account activity: 10%

**Credit Score (0-100):**
- Payment history (on-time vs missed): 50%
- Credit utilization: 20%
- Account age: 15%
- Loan cycles completed (loyalty): 15%

**Credit Tiers:**
- Elite: 85-100
- Growth: 70-84
- Standard: 50-69
- Watch: 30-49
- Restricted: 0-29

**SFIS Eligibility Tiers:**
- Excellent (85-100): Maximum credit access & priority support
- Good (70-84): Strong eligibility & competitive terms
- Fair (50-69): Standard eligibility & terms
- Building (30-49): Limited access, building trust
- Restricted (0-29): Requires savings improvement

**Response:**
```json
{
  "disciplineScore": 85,
  "creditScore": 82,
  "loyaltyProgress": 3,
  "missedPayments": 0,
  "onTimePayments": 12,
  "creditTier": "Growth",
  "sfisTier": "Good"
}
```

---

## Admin APIs

### 19. Get Admin Overview
**Endpoint:** `GET /admin/overview`

**Headers:** `Authorization: Bearer <token>` (must be staff account)

**Backend Logic:**
1. Aggregate all users' data
2. Calculate platform-wide metrics:
   - Total capital deployed
   - Active credit portfolio (sum of all active credits)
   - Repayment rate percentage
   - Total users count
   - User distribution by account type
   - Default rate

**Response:**
```json
{
  "totalCapital": 2500000.00,
  "activeCreditPortfolio": 1875000.00,
  "repaymentRate": 94.5,
  "totalUsers": 2200,
  "usersByType": {
    "student": 1500,
    "staff": 450,
    "alumni": 250
  },
  "defaultRate": 2.3
}
```

---

### 20. Get All Users (Admin)
**Endpoint:** `GET /admin/users`

**Headers:** `Authorization: Bearer <token>` (must be staff account)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `accountType` (optional): filter by student/staff/alumni

**Response:**
```json
{
  "users": [ /* array of user objects */ ],
  "total": 2200,
  "page": 1,
  "totalPages": 44
}
```

---

## Business Logic Requirements

### Critical Calculations

#### 1. Credit Limit Calculation
```
Base Limits:
- Student: $20 - $200
- Staff: $30 - $2000
- Alumni: $30 - $2000

Adjusted Limit = Base Max × (disciplineScore/100) × (creditScore/100)
```

#### 2. Loan Amount Calculation
```
Principal = User requested amount
Service Fee = Principal × 0.015 (1.5%)
Interest = Principal × 0.18 (18% per annum)
Total Credit = Principal + Service Fee + Interest
```

#### 3. Available Savings Calculation
```
If activeCredit > 0:
  lockedSavings = savingsBalance × 0.20 (20%)
  availableSavings = savingsBalance × 0.80 (80%)
Else:
  availableSavings = savingsBalance (100%)
```

#### 4. Discipline Score Calculation
```
Components:
- Savings consistency (30 points): Regular deposits
- On-time payments (40 points): Payment history
- Savings-to-credit ratio (20 points): Savings / Credit
- Account activity (10 points): Login frequency, transactions

Formula:
disciplineScore = (
  (savingsConsistency × 0.30) +
  (onTimePaymentRate × 0.40) +
  (savingsRatio × 0.20) +
  (activityScore × 0.10)
) × 100
```

#### 5. Credit Score Calculation
```
Components:
- Payment history (50 points): onTimePayments / totalPayments
- Credit utilization (20 points): activeCredit / creditLimit
- Account age (15 points): Months since registration
- Loyalty progress (15 points): Completed loan cycles

Formula:
creditScore = (
  (paymentHistoryRate × 0.50) +
  ((1 - utilizationRate) × 0.20) +
  (accountAgeScore × 0.15) +
  (loyaltyScore × 0.15)
) × 100
```

---

## Database Schema Suggestions

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  member_id VARCHAR(20) UNIQUE NOT NULL,
  account_number VARCHAR(12) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  account_type ENUM('student', 'staff', 'alumni') NOT NULL,
  id_number VARCHAR(50),
  id_back_image_url TEXT,
  student_id VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  status ENUM('pending_verification', 'active', 'suspended') DEFAULT 'pending_verification',
  savings_balance DECIMAL(15, 2) DEFAULT 0.00,
  approved_credit_wallet DECIMAL(15, 2) DEFAULT 0.00,
  active_credit DECIMAL(15, 2) DEFAULT 0.00,
  available_credit_limit DECIMAL(15, 2),
  loan_principal DECIMAL(15, 2) DEFAULT 0.00,
  discipline_score INT DEFAULT 75,
  credit_score INT DEFAULT 75,
  loyalty_progress INT DEFAULT 0,
  missed_payments INT DEFAULT 0,
  on_time_payments INT DEFAULT 0,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID NOT NULL,
  type ENUM('deposit', 'withdrawal', 'loan', 'repayment') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  method VARCHAR(50),
  destination VARCHAR(255),
  description TEXT,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Credit Applications Table
```sql
CREATE TABLE credit_applications (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_type ENUM('essential', 'emergency', 'business') NOT NULL,
  requested_amount DECIMAL(15, 2) NOT NULL,
  approved_amount DECIMAL(15, 2),
  total_credit DECIMAL(15, 2),
  with_collateral BOOLEAN DEFAULT FALSE,
  collateral_details JSON,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  repayment_cycle VARCHAR(20),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Loans Table
```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  application_id VARCHAR(50) NOT NULL,
  principal DECIMAL(15, 2) NOT NULL,
  service_fee DECIMAL(15, 2) NOT NULL,
  interest DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  amount_paid DECIMAL(15, 2) DEFAULT 0.00,
  remaining_balance DECIMAL(15, 2) NOT NULL,
  status ENUM('active', 'completed', 'defaulted') DEFAULT 'active',
  disbursed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (application_id) REFERENCES credit_applications(id)
);
```

### Repayment Schedule Table
```sql
CREATE TABLE repayment_schedule (
  id UUID PRIMARY KEY,
  loan_id UUID NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  amount_paid DECIMAL(15, 2) DEFAULT 0.00,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  paid_at TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id)
);
```

### OTP Verification Table
```sql
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inclusive_credit
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h

# Email Service (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@inclusivecredit.com
SMTP_PASSWORD=your_smtp_password

# SMS Service (for OTP)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=InclusiveCredit

# Payment Gateways
ECOCASH_API_KEY=your_ecocash_key
INNBUCKS_API_KEY=your_innbucks_key
ONEMONEY_API_KEY=your_onemoney_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

---

## Error Handling

All endpoints should return errors in this format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
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
- `VALIDATION_ERROR`: Invalid input
- `UNAUTHORIZED`: Invalid/expired token
- `INSUFFICIENT_BALANCE`: Not enough funds
- `INSUFFICIENT_SAVINGS`: Savings requirement not met
- `ACTIVE_LOAN_EXISTS`: User already has active loan
- `CREDIT_LIMIT_EXCEEDED`: Requested amount exceeds limit
- `PAYMENT_GATEWAY_ERROR`: Payment processing failed
- `NOT_FOUND`: Resource not found
- `SERVER_ERROR`: Internal server error

---

## Testing Endpoints

Use tools like Postman or Insomnia to test endpoints.

**Sample Test Flow:**
1. Register user → Get user object
2. Verify OTP → Account activated
3. Login → Get JWT token
4. Deposit funds → Update balance
5. Apply for credit → Get approval
6. Transfer credit to savings → Move funds
7. Make repayment → Update loan balance

---

## Additional Notes

1. **Security:**
   - Hash all passwords (bcrypt, 10 rounds minimum)
   - Validate all inputs
   - Use prepared statements to prevent SQL injection
   - Implement rate limiting on auth endpoints
   - Sanitize user inputs

2. **Payment Integration:**
   - Integrate with real payment gateways (Ecocash, InnBucks, OneMoney)
   - Implement webhook handlers for payment confirmations
   - Handle payment failures gracefully

3. **Notifications:**
   - Send email confirmations for all transactions
   - Send SMS for critical actions (OTP, loan approval, repayments)
   - Implement push notifications for mobile app (future)

4. **Logging:**
   - Log all transactions
   - Log all authentication attempts
   - Log all errors with stack traces

5. **Monitoring:**
   - Track API response times
   - Monitor database queries
   - Set up alerts for errors

---

**Last Updated:** March 13, 2026
**Version:** 1.0.0
