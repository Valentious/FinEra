-- FinEra Database Setup
-- Run as postgres superuser (e.g. in pgAdmin or: psql -U postgres -f create-finera-db.sql)

CREATE USER finera WITH PASSWORD 'finera_secure';
CREATE DATABASE finera_db OWNER finera;
