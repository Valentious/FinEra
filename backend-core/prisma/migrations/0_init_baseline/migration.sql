-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('STUDENT', 'STAFF', 'ALUMNI');

-- CreateEnum
CREATE TYPE "AccountTier" AS ENUM ('TIER_0', 'TIER_1', 'TIER_2', 'TIER_3');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('USD', 'ZIG', 'ZAR', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'FEE', 'INTEREST', 'TRANSFER', 'FX_CONVERSION');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF', 'RESTRUCTURED');

-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('FIXED', 'VARIABLE', 'TIERED');

-- CreateEnum
CREATE TYPE "InterestCalculationMethod" AS ENUM ('SIMPLE', 'COMPOUND', 'REDUCING_BALANCE');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "RepaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'SKIPPED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'PROOF_OF_ADDRESS', 'SELFIE', 'UTILITY_BILL');

-- CreateEnum
CREATE TYPE "KycDocumentSide" AS ENUM ('FRONT', 'BACK', 'SINGLE');

-- CreateEnum
CREATE TYPE "KycDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRANSACTION', 'LOAN_REMINDER', 'KYC_UPDATE', 'SYSTEM_ALERT', 'PROMOTIONAL', 'SECURITY_ALERT', 'LEARNING_NUDGE', 'LEARNING_RECOMMENDATION', 'DEFAULT_WARNING');

-- CreateEnum
CREATE TYPE "LearningModuleTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "LearningModuleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('LESSON', 'MICRO_COURSE', 'WARNING', 'NUDGE');

-- CreateEnum
CREATE TYPE "LearningProfileRiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "FraudRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FraudAction" AS ENUM ('ALLOW', 'FLAG', 'REQUIRE_2FA', 'BLOCK');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'RISK_OFFICER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('CUSTODY', 'SETTLEMENT', 'CLEARING');

-- CreateTable
CREATE TABLE "CurrencyRegistry" (
    "id" TEXT NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL,
    "displayName" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "custodyType" TEXT NOT NULL,
    "dashboardConfig" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "dateOfBirthLocked" BOOLEAN NOT NULL DEFAULT false,
    "accountType" "AccountType" NOT NULL,
    "accountTier" "AccountTier" NOT NULL DEFAULT 'TIER_0',
    "countryCode" TEXT NOT NULL,
    "city" TEXT,
    "institution" TEXT,
    "institutionId" TEXT,
    "phoneNumber" TEXT,
    "title" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpiry" TIMESTAMP(3),
    "emailOtpLastSentAt" TIMESTAMP(3),
    "deviceFingerprints" JSONB,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "statusReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAuth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordLastChanged" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIP" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "refreshToken" TEXT,
    "refreshTokenExpiry" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "wallet_numeric_id" TEXT,
    "balance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "availableBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "holdBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "savingsBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "approvedCreditBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "savingsGoal" DECIMAL(18,8),
    "activeLoanBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalLoanAmount" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalRepaidAmount" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTransactionAt" TIMESTAMP(3),
    "dailyTransactionTotal" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "dailyTransactionCount" INTEGER NOT NULL DEFAULT 0,
    "monthlyTransactionTotal" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL,
    "ledgerName" TEXT,
    "ledgerType" "LedgerType" NOT NULL DEFAULT 'CUSTODY',
    "systemBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL,
    "entryType" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL DEFAULT 'LEGACY:UNSPECIFIED',
    "amount" DECIMAL(18,8) NOT NULL,
    "balanceAfter" DECIMAL(18,8) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "ledgerId" TEXT,
    "transactionType" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "fee" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(18,8) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "exchangeRate" DECIMAL(18,8),
    "originalCurrency" "CurrencyCode",
    "originalAmount" DECIMAL(18,8),
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "failureCode" TEXT,
    "metadata" JSONB,
    "externalReference" TEXT,
    "reversalReference" TEXT,
    "reversalReason" TEXT,
    "approvedBy" TEXT,
    "approvalNote" TEXT,
    "ledger_previous_hash" TEXT,
    "ledger_entry_hash" TEXT,
    "ledger_debit_account" TEXT,
    "ledger_credit_account" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "faceIdEnabled" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "currency" "CurrencyCode",
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "loanNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "principalAmount" DECIMAL(18,8) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "interestType" "InterestType" NOT NULL DEFAULT 'FIXED',
    "interestCalculationMethod" "InterestCalculationMethod" NOT NULL DEFAULT 'REDUCING_BALANCE',
    "totalInterest" DECIMAL(18,8) NOT NULL,
    "fees" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalRepayable" DECIMAL(18,8) NOT NULL,
    "amountDisbursed" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "remainingBalance" DECIMAL(18,8) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "term" INTEGER NOT NULL,
    "termUnit" TEXT NOT NULL DEFAULT 'MONTHS',
    "paymentFrequency" "PaymentFrequency" NOT NULL DEFAULT 'MONTHLY',
    "installmentAmount" DECIMAL(18,8) NOT NULL,
    "disbursementDate" TIMESTAMP(3),
    "firstPaymentDate" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "defaultDate" TIMESTAMP(3),
    "delinquencyStage" INTEGER NOT NULL DEFAULT 0,
    "collateral" JSONB,
    "guarantor" JSONB,
    "approvalDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvalNotes" TEXT,
    "disbursedBy" TEXT,
    "disbursedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "expectedAmount" DECIMAL(18,8) NOT NULL,
    "paidAmount" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "principalPortion" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "interestPortion" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "feePortion" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "paidDate" TIMESTAMP(3),
    "daysLate" INTEGER NOT NULL DEFAULT 0,
    "paidOnTime" BOOLEAN,
    "status" "RepaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "receiptGenerated" BOOLEAN NOT NULL DEFAULT false,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "financialDisciplineScore" INTEGER NOT NULL,
    "previousScore" INTEGER,
    "scoreFactors" JSONB,
    "scoreHistory" JSONB,
    "creditLimit" DECIMAL(18,8) NOT NULL,
    "availableCredit" DECIMAL(18,8) NOT NULL,
    "totalCreditUtilized" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "creditUtilizationRatio" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "repaymentReliability" DECIMAL(5,2) NOT NULL,
    "savingsConsistency" DECIMAL(5,2) NOT NULL,
    "transactionHealth" DECIMAL(5,2) NOT NULL,
    "accountLongevity" INTEGER NOT NULL,
    "kycLevelBonus" INTEGER NOT NULL,
    "lastScoreUpdate" TIMESTAMP(3),
    "nextScoreUpdate" TIMESTAMP(3),
    "scoreVersion" TEXT,
    "riskLevel" "RiskLevel" NOT NULL,
    "riskNotes" TEXT,
    "manualOverrideLimit" DECIMAL(18,8),
    "manualOverrideReason" TEXT,
    "manualOverrideExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "KycDocumentType" NOT NULL,
    "documentSide" "KycDocumentSide" DEFAULT 'SINGLE',
    "status" "KycDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "filePath" TEXT NOT NULL,
    "fileHash" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "extractedData" JSONB,
    "verificationMethod" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "rejectionDetails" JSONB,
    "expiryDate" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ruleTriggered" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" "FraudRiskLevel" NOT NULL,
    "action" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "details" JSONB,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTerm" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "simpleDefinition" TEXT NOT NULL,
    "advancedDefinition" TEXT,
    "example" TEXT,
    "relatedTerms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningModule" (
    "id" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "difficultyLevel" INTEGER,
    "category" TEXT,
    "estimatedDurationMinutes" INTEGER,
    "durationMinutes" INTEGER,
    "prerequisites" JSONB DEFAULT '[]',
    "content" JSONB,
    "tier" "LearningModuleTier" NOT NULL DEFAULT 'FREE',
    "status" "LearningModuleStatus" NOT NULL DEFAULT 'PUBLISHED',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "color" TEXT,
    "termsIncluded" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLearningProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL DEFAULT 'student',
    "disciplineScoreBonus" INTEGER NOT NULL DEFAULT 0,
    "financialDisciplineScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "riskLevel" "LearningProfileRiskLevel" NOT NULL DEFAULT 'low',
    "learningStreakDays" INTEGER NOT NULL DEFAULT 0,
    "weakKnowledgeAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strongKnowledgeAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastActiveAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLearningProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "termId" TEXT,
    "interactionType" TEXT NOT NULL,
    "contextModuleId" TEXT,
    "context" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressTracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "quizScores" JSONB DEFAULT '[]',
    "lastAccessedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "moduleId" TEXT,
    "contentId" TEXT,
    "termId" TEXT,
    "context" TEXT,
    "reason" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "shownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActioned" BOOLEAN NOT NULL DEFAULT false,
    "actionedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerProgram" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_APPLIED',
    "applicationData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshTokenBlacklist" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshTokenBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "totalSavings" DECIMAL(18,8) NOT NULL,
    "activeCredit" DECIMAL(18,8) NOT NULL,
    "approvedCredit" DECIMAL(18,8) NOT NULL,
    "totalDeposited" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalRepaid" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "currencyCode" "CurrencyCode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRegistry_currencyCode_key" ON "CurrencyRegistry"("currencyCode");

-- CreateIndex
CREATE INDEX "CurrencyRegistry_status_idx" ON "CurrencyRegistry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_countryCode_accountType_idx" ON "User"("countryCode", "accountType");

-- CreateIndex
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuth_userId_key" ON "UserAuth"("userId");

-- CreateIndex
CREATE INDEX "UserAuth_userId_idx" ON "UserAuth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_accountNumber_key" ON "Wallet"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_wallet_numeric_id_key" ON "Wallet"("wallet_numeric_id");

-- CreateIndex
CREATE INDEX "Wallet_userId_currencyCode_idx" ON "Wallet"("userId", "currencyCode");

-- CreateIndex
CREATE INDEX "Wallet_accountNumber_idx" ON "Wallet"("accountNumber");

-- CreateIndex
CREATE INDEX "Wallet_currencyCode_idx" ON "Wallet"("currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_currencyCode_key" ON "Wallet"("userId", "currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_currencyCode_key" ON "Ledger"("currencyCode");

-- CreateIndex
CREATE INDEX "Ledger_currencyCode_idx" ON "Ledger"("currencyCode");

-- CreateIndex
CREATE INDEX "LedgerEntry_ledgerId_createdAt_idx" ON "LedgerEntry"("ledgerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");

-- CreateIndex
CREATE INDEX "LedgerEntry_currencyCode_idx" ON "LedgerEntry"("currencyCode");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountCode_idx" ON "LedgerEntry"("accountCode");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_ledger_entry_hash_key" ON "Transaction"("ledger_entry_hash");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_userId_currency_idx" ON "Transaction"("userId", "currency");

-- CreateIndex
CREATE INDEX "Transaction_walletId_currency_idx" ON "Transaction"("walletId", "currency");

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_walletId_transactionType_idx" ON "Transaction"("walletId", "transactionType");

-- CreateIndex
CREATE INDEX "Transaction_ledgerId_createdAt_idx" ON "Transaction"("ledgerId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_role_isActive_idx" ON "AdminUser"("role", "isActive");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_timestamp_idx" ON "AdminAuditLog"("adminId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_timestamp_idx" ON "AdminAuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_loanNumber_key" ON "Loan"("loanNumber");

-- CreateIndex
CREATE INDEX "Loan_userId_status_idx" ON "Loan"("userId", "status");

-- CreateIndex
CREATE INDEX "Loan_status_nextPaymentDate_idx" ON "Loan"("status", "nextPaymentDate");

-- CreateIndex
CREATE INDEX "Loan_loanNumber_idx" ON "Loan"("loanNumber");

-- CreateIndex
CREATE INDEX "Repayment_loanId_scheduledDate_idx" ON "Repayment"("loanId", "scheduledDate");

-- CreateIndex
CREATE INDEX "Repayment_userId_paidDate_idx" ON "Repayment"("userId", "paidDate");

-- CreateIndex
CREATE UNIQUE INDEX "CreditProfile_userId_key" ON "CreditProfile"("userId");

-- CreateIndex
CREATE INDEX "CreditProfile_userId_idx" ON "CreditProfile"("userId");

-- CreateIndex
CREATE INDEX "CreditProfile_riskLevel_lastScoreUpdate_idx" ON "CreditProfile"("riskLevel", "lastScoreUpdate");

-- CreateIndex
CREATE INDEX "KycDocument_userId_documentType_status_idx" ON "KycDocument"("userId", "documentType", "status");

-- CreateIndex
CREATE INDEX "FraudLog_userId_createdAt_idx" ON "FraudLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FraudLog_riskLevel_resolved_idx" ON "FraudLog"("riskLevel", "resolved");

-- CreateIndex
CREATE INDEX "FraudLog_createdAt_idx" ON "FraudLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_type_priority_idx" ON "Notification"("type", "priority");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "domain_events_createdAt_idx" ON "domain_events"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "domain_events_name_createdAt_idx" ON "domain_events"("name", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialTerm_term_key" ON "FinancialTerm"("term");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialTerm_slug_key" ON "FinancialTerm"("slug");

-- CreateIndex
CREATE INDEX "FinancialTerm_term_idx" ON "FinancialTerm"("term");

-- CreateIndex
CREATE INDEX "FinancialTerm_slug_idx" ON "FinancialTerm"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LearningModule_moduleCode_key" ON "LearningModule"("moduleCode");

-- CreateIndex
CREATE UNIQUE INDEX "LearningModule_slug_key" ON "LearningModule"("slug");

-- CreateIndex
CREATE INDEX "LearningModule_tier_status_idx" ON "LearningModule"("tier", "status");

-- CreateIndex
CREATE INDEX "LearningModule_slug_idx" ON "LearningModule"("slug");

-- CreateIndex
CREATE INDEX "LearningModule_moduleCode_idx" ON "LearningModule"("moduleCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserLearningProfile_userId_key" ON "UserLearningProfile"("userId");

-- CreateIndex
CREATE INDEX "UserLearningProfile_userId_idx" ON "UserLearningProfile"("userId");

-- CreateIndex
CREATE INDEX "TermInteraction_userId_idx" ON "TermInteraction"("userId");

-- CreateIndex
CREATE INDEX "TermInteraction_term_idx" ON "TermInteraction"("term");

-- CreateIndex
CREATE INDEX "TermInteraction_createdAt_idx" ON "TermInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "ProgressTracking_userId_idx" ON "ProgressTracking"("userId");

-- CreateIndex
CREATE INDEX "ProgressTracking_moduleId_idx" ON "ProgressTracking"("moduleId");

-- CreateIndex
CREATE INDEX "ProgressTracking_userId_status_idx" ON "ProgressTracking"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressTracking_userId_moduleId_key" ON "ProgressTracking"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "RecommendationLog_userId_shownAt_idx" ON "RecommendationLog"("userId", "shownAt" DESC);

-- CreateIndex
CREATE INDEX "RecommendationLog_type_idx" ON "RecommendationLog"("type");

-- CreateIndex
CREATE INDEX "RecommendationLog_userId_isActioned_idx" ON "RecommendationLog"("userId", "isActioned");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerProgram_userId_key" ON "PartnerProgram"("userId");

-- CreateIndex
CREATE INDEX "PartnerProgram_userId_idx" ON "PartnerProgram"("userId");

-- CreateIndex
CREATE INDEX "PartnerProgram_status_idx" ON "PartnerProgram"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokenBlacklist_tokenHash_key" ON "RefreshTokenBlacklist"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshTokenBlacklist_tokenHash_idx" ON "RefreshTokenBlacklist"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshTokenBlacklist_expiresAt_idx" ON "RefreshTokenBlacklist"("expiresAt");

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_userId_idx" ON "PortfolioSnapshot"("userId");

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_snapshotDate_idx" ON "PortfolioSnapshot"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioSnapshot_userId_snapshotDate_currencyCode_key" ON "PortfolioSnapshot"("userId", "snapshotDate", "currencyCode");

-- AddForeignKey
ALTER TABLE "UserAuth" ADD CONSTRAINT "UserAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repayment" ADD CONSTRAINT "Repayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repayment" ADD CONSTRAINT "Repayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repayment" ADD CONSTRAINT "Repayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditProfile" ADD CONSTRAINT "CreditProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudLog" ADD CONSTRAINT "FraudLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLearningProfile" ADD CONSTRAINT "UserLearningProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermInteraction" ADD CONSTRAINT "TermInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermInteraction" ADD CONSTRAINT "TermInteraction_contextModuleId_fkey" FOREIGN KEY ("contextModuleId") REFERENCES "LearningModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressTracking" ADD CONSTRAINT "ProgressTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressTracking" ADD CONSTRAINT "ProgressTracking_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LearningModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationLog" ADD CONSTRAINT "RecommendationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerProgram" ADD CONSTRAINT "PartnerProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioSnapshot" ADD CONSTRAINT "PortfolioSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

