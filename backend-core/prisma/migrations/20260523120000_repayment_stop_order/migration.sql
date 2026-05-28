-- Repayment stop order template + member upload (salary-based loans)
ALTER TYPE "DocumentTemplateType" ADD VALUE 'REPAYMENT_STOP_ORDER';

ALTER TABLE "MemberDocument" ADD COLUMN IF NOT EXISTS "stopOrderFilePath" TEXT;
ALTER TABLE "MemberDocument" ADD COLUMN IF NOT EXISTS "stopOrderStatus" "MemberDocumentVerificationStatus";

CREATE INDEX IF NOT EXISTS "MemberDocument_stopOrderStatus_idx" ON "MemberDocument"("stopOrderStatus");
