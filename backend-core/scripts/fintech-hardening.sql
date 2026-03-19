-- FinEra - Fintech Security Hardening (Post-Migration)
-- Run after Prisma migrations: psql -U postgres -d finera_db -f fintech-hardening.sql

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Statement and lock timeouts (safety)
ALTER DATABASE finera_db SET statement_timeout = '30s';
ALTER DATABASE finera_db SET lock_timeout = '10s';
ALTER DATABASE finera_db SET idle_in_transaction_session_timeout = '5min';

-- Audit: Enable row-level security on sensitive tables (when ready)
-- ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Loan" ENABLE ROW LEVEL SECURITY;

SELECT 'Fintech hardening applied' AS status;
