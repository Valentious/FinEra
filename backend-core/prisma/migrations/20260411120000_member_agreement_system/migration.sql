-- CreateEnum
CREATE TYPE "DocumentTemplateType" AS ENUM ('AGREEMENT', 'PAYROLL_CONSENT');

-- CreateEnum
CREATE TYPE "MemberDocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentTemplateType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "loanProductType" "LoanProductType" NOT NULL,
    "agreementFilePath" TEXT,
    "consentFilePath" TEXT,
    "agreementStatus" "MemberDocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "consentStatus" "MemberDocumentVerificationStatus",
    "adminNotes" TEXT,
    "assetDocumentationNote" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "employerContact" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "salaryEstimate" DECIMAL(18,2) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberDefaultCompliance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consecutiveMissedRepayments" INTEGER NOT NULL DEFAULT 0,
    "defaultFlagged" BOOLEAN NOT NULL DEFAULT false,
    "defaultFlaggedAt" TIMESTAMP(3),
    "payrollEnforcementEligible" BOOLEAN NOT NULL DEFAULT false,
    "employerNotifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberDefaultCompliance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_documentType_key" ON "DocumentTemplate"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "MemberDocument_userId_key" ON "MemberDocument"("userId");

-- CreateIndex
CREATE INDEX "MemberDocument_agreementStatus_idx" ON "MemberDocument"("agreementStatus");

-- CreateIndex
CREATE INDEX "MemberDocument_consentStatus_idx" ON "MemberDocument"("consentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentDetails_userId_key" ON "EmploymentDetails"("userId");

-- CreateIndex
CREATE INDEX "EmploymentDetails_verified_idx" ON "EmploymentDetails"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "MemberDefaultCompliance_userId_key" ON "MemberDefaultCompliance"("userId");

-- AddForeignKey
ALTER TABLE "MemberDocument" ADD CONSTRAINT "MemberDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentDetails" ADD CONSTRAINT "EmploymentDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDefaultCompliance" ADD CONSTRAINT "MemberDefaultCompliance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
