-- At most one ACTIVE loan per FinEra ledger account (Wallet/LedgerAccount for that currency).
CREATE UNIQUE INDEX IF NOT EXISTS "Loan_one_active_loan_per_ledger_account"
ON "Loan" ("ledgerAccountId")
WHERE status = 'ACTIVE';
