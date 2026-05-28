-- CreateEnum
CREATE TYPE "MemberAgreementDocumentType" AS ENUM ('LOAN_REPAYMENT_STOP_ORDER');

-- CreateEnum
CREATE TYPE "MemberAgreementDocumentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "MemberAgreementDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "MemberAgreementDocumentType" NOT NULL,
    "status" "MemberAgreementDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberAgreementDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberAgreementDocument_userId_documentType_key" ON "MemberAgreementDocument"("userId", "documentType");

-- CreateIndex
CREATE INDEX "MemberAgreementDocument_userId_idx" ON "MemberAgreementDocument"("userId");

-- CreateIndex
CREATE INDEX "MemberAgreementDocument_status_idx" ON "MemberAgreementDocument"("status");

-- AddForeignKey
ALTER TABLE "MemberAgreementDocument" ADD CONSTRAINT "MemberAgreementDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
