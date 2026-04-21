-- ── Standardize Unique Constraints ──
-- This script safely replaces auto-generated Hibernate constraint names (e.g. uk_427e...)
-- with standardized, predictable names (uk_patients_patient_id, etc.)

-- 1. Patients Table: Standardize 'patient_id' constraint
DO $$
BEGIN
    -- Drop any existing unique constraint on patients(patient_id)
    -- We search by column to find the auto-generated name
    EXECUTE (
        SELECT 'ALTER TABLE patients DROP CONSTRAINT ' || quote_ident(conname)
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE rel.relname = 'patients' AND con.contype = 'u' AND att.attname = 'patient_id'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'No existing constraint found for patient_id';
END $$;

ALTER TABLE patients ADD CONSTRAINT uk_patients_patient_id UNIQUE (patient_id);


-- 2. Users Table: Standardize 'username' constraint
DO $$
BEGIN
    EXECUTE (
        SELECT 'ALTER TABLE users DROP CONSTRAINT ' || quote_ident(conname)
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE rel.relname = 'users' AND con.contype = 'u' AND att.attname = 'username'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'No existing constraint found for username';
END $$;

ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);


-- 3. Password Reset Tokens: Standardize 'token' constraint
DO $$
BEGIN
    EXECUTE (
        SELECT 'ALTER TABLE password_reset_tokens DROP CONSTRAINT ' || quote_ident(conname)
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE rel.relname = 'password_reset_tokens' AND con.contype = 'u' AND att.attname = 'token'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'No existing constraint found for token';
END $$;

ALTER TABLE password_reset_tokens ADD CONSTRAINT uk_password_reset_token UNIQUE (token);
