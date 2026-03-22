-- FinEra Inclusive Credit - Production Database Schema
-- American Fintech Standards | Double-Entry Ledger | ACID Compliant
-- PostgreSQL 15+

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== ENUMS ====================

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE user_status AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE currency_code AS ENUM ('USD', 'ZIG', 'ZAR', 'EUR', 'GBP');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED');

-- ==================== USERS ====================
-- Auth service owns this table; user-service extends via profile

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    role                user_role NOT NULL DEFAULT 'USER',
    status              user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified      BOOLEAN DEFAULT FALSE,
    two_factor_enabled  BOOLEAN DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ,
    last_login_ip       VARCHAR(45),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

-- ==================== WALLETS ====================
-- Ledger service owns wallet balances; double-entry enforced

CREATE TABLE wallets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency_code       currency_code NOT NULL DEFAULT 'USD',
    account_number      VARCHAR(20) NOT NULL UNIQUE,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, currency_code)
);

CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_account ON wallets(account_number);

-- ==================== LEDGER (DOUBLE-ENTRY) ====================
-- CRITICAL: Every transaction = debit_account + credit_account + amount
-- Immutable; no direct balance updates; audit trail via entries

CREATE TABLE ledger_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash    VARCHAR(64) NOT NULL UNIQUE,
    debit_account       UUID NOT NULL REFERENCES wallets(id),
    credit_account      UUID NOT NULL REFERENCES wallets(id),
    amount              DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
    currency            currency_code NOT NULL,
    reference           VARCHAR(100),
    metadata            JSONB,
    timestamp           TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    CHECK (debit_account != credit_account)
);

CREATE INDEX idx_ledger_debit ON ledger_entries(debit_account);
CREATE INDEX idx_ledger_credit ON ledger_entries(credit_account);
CREATE INDEX idx_ledger_hash ON ledger_entries(transaction_hash);
CREATE INDEX idx_ledger_timestamp ON ledger_entries(timestamp);

-- ==================== TRANSACTIONS (Business View) ====================
-- Denormalized view for queries; ledger_entries is source of truth

CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference           VARCHAR(50) NOT NULL UNIQUE,
    user_id             UUID NOT NULL REFERENCES users(id),
    wallet_id           UUID NOT NULL REFERENCES wallets(id),
    ledger_entry_id     UUID REFERENCES ledger_entries(id),
    amount              DECIMAL(18, 8) NOT NULL,
    fee                 DECIMAL(18, 8) DEFAULT 0,
    net_amount          DECIMAL(18, 8) NOT NULL,
    currency            currency_code NOT NULL,
    status              transaction_status DEFAULT 'PENDING',
    transaction_type    VARCHAR(50),
    metadata            JSONB,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ==================== CREDIT SCORES ====================
-- Credit engine owns this; single centralized engine

CREATE TABLE credit_scores (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    financial_discipline_score   INT NOT NULL CHECK (financial_discipline_score >= 0 AND financial_discipline_score <= 1000),
    credit_limit                DECIMAL(18, 8) NOT NULL DEFAULT 0,
    available_credit            DECIMAL(18, 8) NOT NULL DEFAULT 0,
    risk_level                  VARCHAR(20),
    score_factors               JSONB,
    last_updated                TIMESTAMPTZ DEFAULT NOW(),
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_scores_user ON credit_scores(user_id);
CREATE INDEX idx_credit_scores_risk ON credit_scores(risk_level);

-- ==================== AUDIT LOGS ====================
-- Admin service + all services write here for compliance

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    admin_id    UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   VARCHAR(100) NOT NULL,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    timestamp   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ==================== EVENT QUEUE (Placeholder for Kafka/RabbitMQ) ====================
-- Structure ready for: UserRegistered, TransactionCompleted, CreditScoreUpdated

CREATE TABLE event_outbox (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type      VARCHAR(100) NOT NULL,
    payload         JSONB NOT NULL,
    status          VARCHAR(20) DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    processed_at    TIMESTAMPTZ
);

CREATE INDEX idx_event_outbox_status ON event_outbox(status);
CREATE INDEX idx_event_outbox_type ON event_outbox(event_type);
