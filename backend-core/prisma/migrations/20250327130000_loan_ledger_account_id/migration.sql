-- AlterTable: bind each loan to the user's LedgerAccount for that currency
ALTER TABLE "Loan" ADD COLUMN IF NOT EXISTS "ledgerAccountId" TEXT;

UPDATE "Loan" l
SET "ledgerAccountId" = w."ledgerAccountId"
FROM "Wallet" w
WHERE w."id" = l."walletId" AND (l."ledgerAccountId" IS NULL OR l."ledgerAccountId" = '');

ALTER TABLE "Loan" ALTER COLUMN "ledgerAccountId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Loan_ledgerAccountId_fkey'
  ) THEN
    ALTER TABLE "Loan"
      ADD CONSTRAINT "Loan_ledgerAccountId_fkey"
      FOREIGN KEY ("ledgerAccountId") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Loan_userId_currency_idx" ON "Loan"("userId", "currency");
CREATE INDEX IF NOT EXISTS "Loan_ledgerAccountId_idx" ON "Loan"("ledgerAccountId");
