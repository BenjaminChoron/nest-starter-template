-- Enable commonly used PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- For cryptographic functions
CREATE EXTENSION IF NOT EXISTS "citext";         -- For case-insensitive text fields

-- Set default timezone to UTC
ALTER DATABASE ${POSTGRES_DB} SET timezone TO 'UTC';

-- Basic security settings
ALTER DATABASE ${POSTGRES_DB} SET ssl TO 'on';

-- Recommended performance settings
ALTER DATABASE ${POSTGRES_DB} SET 
    statement_timeout = '60s',
    lock_timeout = '30s',
    idle_in_transaction_session_timeout = '60s';

-- Set search path to public by default
ALTER DATABASE ${POSTGRES_DB} SET search_path TO public; 