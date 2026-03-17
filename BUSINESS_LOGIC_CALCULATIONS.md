# Business Logic & Calculations Reference

## For Backend Developers

This document contains all the formulas and business logic that **MUST BE IMPLEMENTED IN THE BACKEND**. The frontend should NOT perform these calculations.

---

## 1. User Account Creation

### Member ID Generation
```javascript
// Format: MEM + 8 digits
// Example: MEM12345678

function generateMemberId() {
  // Option 1: Timestamp-based
  return 'MEM' + Date.now().toString().slice(-8);
  
  // Option 2: Sequential (from database)
  // SELECT MAX(member_id) FROM users;
  // Increment and format
}
```

### Account Number Generation
```javascript
// Format: 12-digit unique number
// Example: 173247856901

function generateAccountNumber() {
  // Option 1: Timestamp + Random
  const timestamp = Date.now().toString().slice(-9);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return timestamp + random;
  
  // Option 2: Sequential (from database)
  // SELECT MAX(account_number) FROM users;
  // Increment by 1
}
```

### Initial Credit Limit
```javascript
function getInitialCreditLimit(accountType) {
  const limits = {
    student: 200,
    staff: 2000,
    alumni: 2000
  };
  return limits[accountType];
}
```

---

## 2. Credit Application Logic

### Eligibility Check
```javascript
function checkLoanEligibility(user, application) {
  const errors = [];
  
  // Rule 1: No active loan
  if (user.activeCredit > 0) {
    errors.push('User already has an active loan');
  }
  
  // Rule 2: Account must be verified
  if (!user.isVerified) {
    errors.push('Account not verified');
  }
  
  // Rule 3: Savings requirement (20% for non-emergency)
  if (application.creditType !== 'emergency') {
    const requiredSavings = application.amount * 0.20;
    if (user.savingsBalance < requiredSavings) {
      errors.push(`Insufficient savings. Required: $${requiredSavings}, Current: $${user.savingsBalance}`);
    }
  }
  
  // Rule 4: Credit limit check
  if (application.amount > user.availableCreditLimit) {
    errors.push(`Amount exceeds credit limit of $${user.availableCreditLimit}`);
  }
  
  // Rule 5: Minimum/Maximum limits by credit type
  const limits = {
    essential: { min: 20, max: 5000 },
    emergency: { min: 20, max: 3000 },
    business: { min: 20, max: 10000 }
  };
  
  const typeLimit = limits[application.creditType];
  if (application.amount < typeLimit.min || application.amount > typeLimit.max) {
    errors.push(`Amount must be between $${typeLimit.min} and $${typeLimit.max} for ${application.creditType} loans`);
  }
  
  return {
    eligible: errors.length === 0,
    errors: errors
  };
}
```

### Loan Amount Calculation
```javascript
function calculateLoanDetails(principal) {
  const serviceFee = principal * 0.015;  // 1.5% service fee
  const interest = principal * 0.18;      // 18% annual interest
  const totalCredit = principal + serviceFee + interest;
  
  return {
    principal: principal,              // Amount user receives
    serviceFee: serviceFee,           // 1.5%
    interest: interest,               // 18%
    totalCredit: totalCredit,        // What user must repay
    serviceFeeRate: 0.015,           // 1.5%
    interestRate: 0.18               // 18%
  };
}

// Example:
// $1000 loan
// Service Fee: $1000 × 0.015 = $15
// Interest: $1000 × 0.18 = $180
// Total Credit: $1000 + $15 + $180 = $1195 (to repay)
```

### Loan Approval Process
```javascript
async function approveLoan(userId, applicationId) {
  // 1. Fetch user and application
  const user = await db.getUser(userId);
  const app = await db.getCreditApplication(applicationId);
  
  // 2. Calculate loan details
  const loanDetails = calculateLoanDetails(app.amount);
  
  // 3. Update user balances
  user.approvedCreditWallet += loanDetails.principal;  // Add principal to credit wallet
  user.activeCredit = loanDetails.totalCredit;         // Set active credit (with fees)
  user.loanPrincipal = loanDetails.principal;          // Track original principal
  
  // 4. Lock 20% of savings (if applicable)
  if (app.creditType !== 'emergency') {
    user.lockedSavings = user.savingsBalance * 0.20;
  }
  
  // 5. Create loan record
  const loan = {
    userId: userId,
    applicationId: applicationId,
    principal: loanDetails.principal,
    serviceFee: loanDetails.serviceFee,
    interest: loanDetails.interest,
    totalAmount: loanDetails.totalCredit,
    amountPaid: 0,
    remainingBalance: loanDetails.totalCredit,
    status: 'active',
    disbursedAt: new Date()
  };
  await db.createLoan(loan);
  
  // 6. Create transaction record
  const transaction = {
    userId: userId,
    type: 'loan',
    amount: loanDetails.principal,
    description: `${app.creditType} loan approved`,
    status: 'completed'
  };
  await db.createTransaction(transaction);
  
  // 7. Generate repayment schedule
  const schedule = generateRepaymentSchedule(loan, app.repaymentCycle);
  await db.createRepaymentSchedule(schedule);
  
  // 8. Send notification
  await sendEmail(user.email, 'Loan Approved', { amount: loanDetails.principal });
  
  return {
    success: true,
    approvedAmount: loanDetails.principal,
    totalCredit: loanDetails.totalCredit,
    repaymentSchedule: schedule
  };
}
```

---

## 3. Savings & Withdrawal Logic

### Available Balance Calculation
```javascript
function calculateAvailableBalance(user) {
  // If user has active loan, 20% of savings is locked
  if (user.activeCredit > 0) {
    const lockedSavings = user.savingsBalance * 0.20;
    const availableSavings = user.savingsBalance * 0.80;
    
    return {
      totalSavings: user.savingsBalance,
      lockedSavings: lockedSavings,
      availableSavings: availableSavings,
      canWithdraw: availableSavings
    };
  } else {
    return {
      totalSavings: user.savingsBalance,
      lockedSavings: 0,
      availableSavings: user.savingsBalance,
      canWithdraw: user.savingsBalance
    };
  }
}
```

### Withdrawal Validation
```javascript
function validateWithdrawal(user, amount) {
  const balance = calculateAvailableBalance(user);
  
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (amount > balance.canWithdraw) {
    return { 
      valid: false, 
      error: `Insufficient available balance. You can withdraw up to $${balance.canWithdraw}` 
    };
  }
  
  return { valid: true };
}
```

---

## 4. Repayment Logic

### Repayment Processing
```javascript
async function processRepayment(userId, amount, method) {
  const user = await db.getUser(userId);
  const loan = await db.getActiveLoan(userId);
  
  // 1. Validate repayment
  if (amount > loan.remainingBalance) {
    throw new Error('Repayment amount exceeds outstanding balance');
  }
  
  // 2. Process payment based on method
  if (method === 'savings') {
    // Deduct from savings
    if (amount > user.savingsBalance) {
      throw new Error('Insufficient savings balance');
    }
    user.savingsBalance -= amount;
  } else {
    // Process through payment gateway
    const payment = await paymentGateway.processPayment(method, amount);
    if (!payment.success) {
      throw new Error('Payment processing failed');
    }
  }
  
  // 3. Update loan balance
  loan.amountPaid += amount;
  loan.remainingBalance -= amount;
  user.activeCredit -= amount;
  
  // 4. Check if loan is fully paid
  const loanFullyPaid = loan.remainingBalance <= 0;
  
  if (loanFullyPaid) {
    loan.status = 'completed';
    loan.completedAt = new Date();
    user.activeCredit = 0;
    user.loanPrincipal = 0;
    user.lockedSavings = 0;  // Unlock savings
    user.loyaltyProgress += 1;  // Increment loyalty
  }
  
  // 5. Update payment tracking
  const isOnTime = checkIfPaymentOnTime(loan, amount);
  if (isOnTime) {
    user.onTimePayments += 1;
  } else {
    user.missedPayments += 1;
  }
  
  // 6. Recalculate scores
  const scores = recalculateScores(user, loanFullyPaid);
  user.disciplineScore = scores.disciplineScore;
  user.creditScore = scores.creditScore;
  
  // 7. Create transaction record
  const transaction = {
    userId: userId,
    type: 'repayment',
    amount: amount,
    description: `Repayment via ${method}`,
    status: 'completed'
  };
  await db.createTransaction(transaction);
  
  // 8. Update database
  await db.updateUser(user);
  await db.updateLoan(loan);
  
  // 9. Send confirmation
  await sendEmail(user.email, 'Repayment Confirmed', { amount, remainingBalance: loan.remainingBalance });
  
  return {
    transaction: transaction,
    remainingBalance: loan.remainingBalance,
    loanFullyPaid: loanFullyPaid,
    updatedScores: {
      disciplineScore: user.disciplineScore,
      creditScore: user.creditScore
    }
  };
}
```

---

## 5. Financial Score Calculations

### Discipline Score (0-100)
```javascript
function calculateDisciplineScore(user) {
  // Component 1: Savings Consistency (30 points)
  const savingsConsistency = calculateSavingsConsistency(user);  // 0-100
  const savingsPoints = (savingsConsistency / 100) * 30;
  
  // Component 2: On-Time Payments (40 points)
  const totalPayments = user.onTimePayments + user.missedPayments;
  const onTimeRate = totalPayments > 0 ? (user.onTimePayments / totalPayments) : 0;
  const paymentPoints = onTimeRate * 40;
  
  // Component 3: Savings-to-Credit Ratio (20 points)
  let ratioPoints = 0;
  if (user.activeCredit > 0) {
    const ratio = user.savingsBalance / user.loanPrincipal;
    ratioPoints = Math.min(ratio / 0.20, 1) * 20;  // 20% savings = full points
  } else {
    ratioPoints = 20;  // No loan = full points
  }
  
  // Component 4: Account Activity (10 points)
  const activityScore = calculateActivityScore(user);  // 0-100
  const activityPoints = (activityScore / 100) * 10;
  
  // Total
  const disciplineScore = Math.round(savingsPoints + paymentPoints + ratioPoints + activityPoints);
  
  return Math.min(100, Math.max(0, disciplineScore));
}

function calculateSavingsConsistency(user) {
  // Analyze deposit patterns over last 6 months
  // Regular deposits = higher score
  // Formula depends on your deposit history analysis
  // For now, simplified:
  const deposits = user.transactions.filter(t => t.type === 'deposit');
  if (deposits.length === 0) return 0;
  
  const last6Months = new Date();
  last6Months.setMonth(last6Months.getMonth() - 6);
  
  const recentDeposits = deposits.filter(d => new Date(d.date) > last6Months);
  const consistency = Math.min((recentDeposits.length / 6) * 100, 100);
  
  return consistency;
}

function calculateActivityScore(user) {
  // Based on login frequency and transaction count
  const daysSinceLastLogin = (Date.now() - user.lastLogin) / (1000 * 60 * 60 * 24);
  const loginScore = daysSinceLastLogin < 7 ? 100 : Math.max(0, 100 - daysSinceLastLogin);
  
  const transactionCount = user.transactions.length;
  const transactionScore = Math.min((transactionCount / 20) * 100, 100);
  
  return (loginScore + transactionScore) / 2;
}
```

### Credit Score (0-100)
```javascript
function calculateCreditScore(user) {
  // Component 1: Payment History (50 points)
  const totalPayments = user.onTimePayments + user.missedPayments;
  const paymentHistoryRate = totalPayments > 0 ? (user.onTimePayments / totalPayments) : 0.75;  // Default 75%
  const paymentHistoryPoints = paymentHistoryRate * 50;
  
  // Component 2: Credit Utilization (20 points)
  let utilizationPoints = 20;
  if (user.availableCreditLimit > 0) {
    const utilizationRate = user.activeCredit / user.availableCreditLimit;
    // Lower utilization = better score
    utilizationPoints = (1 - Math.min(utilizationRate, 1)) * 20;
  }
  
  // Component 3: Account Age (15 points)
  const accountAgeMonths = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  const agePoints = Math.min((accountAgeMonths / 12) * 15, 15);  // Full points at 12 months
  
  // Component 4: Loyalty Progress (15 points)
  const loyaltyPoints = Math.min((user.loyaltyProgress / 10) * 15, 15);  // Full points at 10 cycles
  
  // Total
  const creditScore = Math.round(paymentHistoryPoints + utilizationPoints + agePoints + loyaltyPoints);
  
  return Math.min(100, Math.max(0, creditScore));
}
```

### Score Update Triggers
```javascript
function recalculateScores(user, loanFullyPaid = false) {
  let disciplineScore = calculateDisciplineScore(user);
  let creditScore = calculateCreditScore(user);
  
  // Bonus for completing loan
  if (loanFullyPaid) {
    disciplineScore = Math.min(100, disciplineScore + 5);
    creditScore = Math.min(100, creditScore + 3);
  }
  
  return {
    disciplineScore: disciplineScore,
    creditScore: creditScore
  };
}
```

### Credit Tiers
```javascript
function getCreditTier(creditScore) {
  if (creditScore >= 85) return { tier: 'Elite', color: 'purple' };
  if (creditScore >= 70) return { tier: 'Growth', color: 'blue' };
  if (creditScore >= 50) return { tier: 'Standard', color: 'green' };
  if (creditScore >= 30) return { tier: 'Watch', color: 'amber' };
  return { tier: 'Restricted', color: 'red' };
}

function getSFISEligibilityTier(creditScore) {
  if (creditScore >= 85) return { 
    tier: 'Excellent', 
    description: 'Maximum credit access & priority support' 
  };
  if (creditScore >= 70) return { 
    tier: 'Good', 
    description: 'Strong eligibility & competitive terms' 
  };
  if (creditScore >= 50) return { 
    tier: 'Fair', 
    description: 'Standard eligibility & terms' 
  };
  if (creditScore >= 30) return { 
    tier: 'Building', 
    description: 'Limited access, building trust' 
  };
  return { 
    tier: 'Restricted', 
    description: 'Requires savings improvement' 
  };
}
```

---

## 6. Repayment Schedule Generation

```javascript
function generateRepaymentSchedule(loan, repaymentCycle) {
  // Parse repayment cycle (e.g., "12 months", "6 months")
  const months = parseInt(repaymentCycle);
  const monthlyInstallment = loan.totalAmount / months;
  
  const schedule = [];
  const startDate = new Date(loan.disbursedAt);
  
  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      loanId: loan.id,
      dueDate: dueDate,
      amount: monthlyInstallment,
      amountPaid: 0,
      status: 'pending'
    });
  }
  
  return schedule;
}

function checkIfPaymentOnTime(loan, amount) {
  // Get current repayment schedule item
  const schedule = db.getRepaymentSchedule(loan.id);
  const currentDue = schedule.find(s => s.status === 'pending');
  
  if (!currentDue) return true;  // No upcoming payment
  
  const today = new Date();
  const dueDate = new Date(currentDue.dueDate);
  
  // Payment is on-time if made before or on due date
  return today <= dueDate;
}
```

---

## 7. Admin Dashboard Metrics

```javascript
async function calculateAdminMetrics() {
  // 1. Total Capital Deployed
  const totalCapital = await db.sum('loans', 'principal');
  
  // 2. Active Credit Portfolio
  const activeCreditPortfolio = await db.sum('loans', 'remainingBalance', { status: 'active' });
  
  // 3. Repayment Rate
  const totalLoaned = await db.sum('loans', 'totalAmount');
  const totalRepaid = await db.sum('loans', 'amountPaid');
  const repaymentRate = (totalRepaid / totalLoaned) * 100;
  
  // 4. Total Users
  const totalUsers = await db.count('users');
  
  // 5. Users by Type
  const usersByType = await db.groupCount('users', 'accountType');
  
  // 6. Default Rate
  const overdueLoans = await db.count('loans', { status: 'defaulted' });
  const totalLoans = await db.count('loans');
  const defaultRate = (overdueLoans / totalLoans) * 100;
  
  return {
    totalCapital,
    activeCreditPortfolio,
    repaymentRate,
    totalUsers,
    usersByType: {
      student: usersByType.student || 0,
      staff: usersByType.staff || 0,
      alumni: usersByType.alumni || 0
    },
    defaultRate
  };
}
```

---

## 8. Payment Gateway Integration

```javascript
async function processDeposit(userId, amount, method) {
  let paymentResult;
  
  switch(method) {
    case 'Ecocash':
      paymentResult = await ecocashAPI.initiate({
        amount: amount,
        phoneNumber: user.phoneNumber,
        reference: `DEP${Date.now()}`
      });
      break;
      
    case 'InnBucks':
      paymentResult = await innbucksAPI.deposit({
        amount: amount,
        accountNumber: user.accountNumber
      });
      break;
      
    case 'OneMoney':
      paymentResult = await onemoneyAPI.deposit({
        amount: amount,
        phoneNumber: user.phoneNumber
      });
      break;
      
    case 'Bank Transfer':
      // Manual verification needed
      paymentResult = { success: false, pendingVerification: true };
      break;
  }
  
  if (paymentResult.success) {
    // Update user balance
    user.savingsBalance += amount;
    await db.updateUser(user);
    
    // Create transaction
    await db.createTransaction({
      userId: userId,
      type: 'deposit',
      amount: amount,
      method: method,
      status: 'completed',
      paymentRef: paymentResult.reference
    });
  }
  
  return paymentResult;
}

async function processWithdrawal(userId, amount, method, destination) {
  let paymentResult;
  
  switch(method) {
    case 'Ecocash':
      paymentResult = await ecocashAPI.payout({
        amount: amount,
        phoneNumber: destination,
        reference: `WD${Date.now()}`
      });
      break;
      
    case 'InnBucks':
      paymentResult = await innbucksAPI.withdraw({
        amount: amount,
        accountNumber: destination
      });
      break;
      
    case 'OneMoney':
      paymentResult = await onemoneyAPI.payout({
        amount: amount,
        phoneNumber: destination
      });
      break;
  }
  
  if (paymentResult.success) {
    // Update user balance
    user.savingsBalance -= amount;
    await db.updateUser(user);
    
    // Create transaction
    await db.createTransaction({
      userId: userId,
      type: 'withdrawal',
      amount: amount,
      method: method,
      destination: destination,
      status: 'completed',
      paymentRef: paymentResult.reference
    });
  }
  
  return paymentResult;
}
```

---

## 9. OTP Generation & Verification

```javascript
function generateOTP() {
  // Generate 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, phoneNumber) {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);  // 10 minutes
  
  // Save OTP to database
  await db.createOTP({
    email: email,
    otpCode: otp,
    expiresAt: expiresAt,
    isUsed: false
  });
  
  // Send via email
  await sendEmail(email, 'Your OTP Code', { otp: otp });
  
  // Send via SMS
  await sendSMS(phoneNumber, `Your OTP code is: ${otp}. Valid for 10 minutes.`);
  
  return { success: true };
}

async function verifyOTP(email, otpCode) {
  const otpRecord = await db.getOTP({ email, otpCode, isUsed: false });
  
  if (!otpRecord) {
    return { valid: false, error: 'Invalid OTP code' };
  }
  
  if (new Date() > new Date(otpRecord.expiresAt)) {
    return { valid: false, error: 'OTP code expired' };
  }
  
  // Mark as used
  await db.updateOTP(otpRecord.id, { isUsed: true });
  
  // Mark user as verified
  await db.updateUser({ email: email }, { isVerified: true });
  
  return { valid: true };
}
```

---

## 10. JWT Token Management

```javascript
const jwt = require('jsonwebtoken');

function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    accountType: user.accountType
  };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
  
  return token;
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, data: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Middleware for protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const verification = verifyToken(token);
  
  if (!verification.valid) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  req.user = verification.data;
  next();
}
```

---

## Summary of Backend Responsibilities

### ✅ Backend MUST Handle:
1. **Security**: Password hashing, JWT tokens, input validation
2. **Calculations**: Interest, fees, scores, limits
3. **Business Rules**: Eligibility checks, savings locks, payment validation
4. **Data Persistence**: Database operations, transactions
5. **External Integrations**: Payment gateways, email/SMS services
6. **Real-time Updates**: Balance updates, score recalculation
7. **Scheduled Tasks**: Overdue payment detection, score updates

### ❌ Frontend Should NOT:
1. Calculate interest or fees
2. Generate member IDs or account numbers
3. Approve/reject loans
4. Process payments
5. Calculate financial scores
6. Store sensitive data
7. Make business logic decisions

---

**Last Updated:** March 13, 2026  
**Version:** 1.0.0
