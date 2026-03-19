-- FinEra - Database Creation & Security Hardening
-- Run as postgres superuser: psql -U postgres -f create-finera-db.sql

-- Create database
CREATE DATABASE finera_db
  WITH ENCODING = 'UTF8'
       LC_COLLATE = 'C'
       LC_CTYPE = 'C'
       TEMPLATE = template0;

\c finera_db

-- Extensions for fintech
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Revoke default public privileges
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE finera_db FROM PUBLIC;

-- Grant connect to postgres (for Prisma migrations)
GRANT CONNECT ON DATABASE finera_db TO postgres;
GRANT ALL ON SCHEMA public TO postgres;

-- Optional: Create application role (use when moving to production)
-- CREATE ROLE finera_app WITH LOGIN PASSWORD 'your-secure-password';
-- GRANT CONNECT ON DATABASE finera_db TO finera_app;
-- GRANT USAGE ON SCHEMA public TO finera_app;
-- GRANT CREATE ON SCHEMA public TO finera_app;

-- Database-level security settings
ALTER DATABASE finera_db SET statement_timeout = '30s';
ALTER DATABASE finera_db SET lock_timeout = '10s';
ALTER DATABASE finera_db SET idle_in_transaction_session_timeout = '5min';

-- Log completion message
SELECT 'finera_db created and hardened' AS status;
