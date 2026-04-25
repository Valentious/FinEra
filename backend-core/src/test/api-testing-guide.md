# FinEra API Testing Guide

## Base URL
```
http://localhost:4000/api/v1
```

## Test All Endpoints with Postman/cURL

### 1. Health Check
```bash
curl -X GET http://localhost:4000/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Authentication Endpoints

#### Register User
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "password": "SecurePass123!@#",
    "fullName": "John Doe",
    "accountType": "STUDENT",
    "country": "ZW",
    "city": "Harare",
    "institution": "University of Zimbabwe"
  }'
```
**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "userId": "uuid-here",
    "email": "test@university.edu"
  }
}
```

#### Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "password": "TestPassword123!"
  }'
```
**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

#### Refresh Token
```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### 3. User Profile (Requires Auth)
```bash
curl -X GET http://localhost:4000/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "test@university.edu",
    "fullName": "John Doe",
    "accountType": "STUDENT",
    "accountTier": "TIER_0",
    "countryCode": "ZW",
    "city": "Harare",
    "institution": "University of Zimbabwe",
    "emailVerified": false,
    "lastLoginAt": null,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 4. Wallet Operations

#### Get Wallets
```bash
curl -X GET http://localhost:4000/api/v1/user/wallets \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "wallet-uuid",
      "currencyCode": "USD",
      "accountNumber": "FIN123456789012",
      "balance": "0",
      "savingsBalance": "0",
      "activeLoanBalance": "0"
    }
  ]
}
```

### 5. Transaction Endpoints

#### Make Deposit
```bash
curl -X POST http://localhost:4000/api/v1/transactions/deposit \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "paymentMethod": "ECOCASH",
    "metadata": {"phoneNumber": "+263771234567"}
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-uuid",
    "status": "PENDING",
    "reference": "TXN-20240101-ABC12345",
    "instructions": "Complete payment on your device"
  }
}
```

#### Make Withdrawal
```bash
curl -X POST http://localhost:4000/api/v1/transactions/withdraw \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "currency": "USD",
    "withdrawalMethod": "BANK_TRANSFER",
    "accountDetails": {
      "bankName": "Stanbic Bank",
      "accountNumber": "1234567890",
      "accountName": "John Doe"
    }
  }'
```

#### Get Transaction History
```bash
curl -X GET "http://localhost:4000/api/v1/transactions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### 6. Credit Operations

#### Get Credit Score
```bash
curl -X GET http://localhost:4000/api/v1/credit/score \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "score": 75,
    "factors": {
      "repaymentReliability": 80,
      "savingsConsistency": 70,
      "transactionHealth": 75,
      "accountLongevity": 60,
      "kycLevelBonus": 0
    },
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Get Credit Limit
```bash
curl -X GET http://localhost:4000/api/v1/credit/limit \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Apply for Loan
```bash
curl -X POST http://localhost:4000/api/v1/credit/apply \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300,
    "currency": "USD",
    "term": 6
  }'
```

#### Get Loans
```bash
curl -X GET http://localhost:4000/api/v1/credit/loans \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. KYC Operations

#### Upload Document
```bash
curl -X POST http://localhost:4000/api/v1/kyc/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "documentType=ID_FRONT" \
  -F "file=@/path/to/id.jpg"
```

#### Check KYC Status
```bash
curl -X GET http://localhost:4000/api/v1/kyc/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. Notifications

#### Get Notifications
```bash
curl -X GET "http://localhost:4000/api/v1/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Mark as Read
```bash
curl -X PUT http://localhost:4000/api/v1/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Seed User Credentials
- **Email:** test@university.edu
- **Password:** TestPassword123!
