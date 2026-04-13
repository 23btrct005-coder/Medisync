-- MediSync Database Fix Script
-- Run this in your Supabase SQL Editor if the 'relation does not exist' error persists.

-- 1. Create Medical Records table if it doesn't exist
CREATE TABLE IF NOT EXISTS medical_records (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    date DATE,
    diagnosis VARCHAR(255),
    doctor_name VARCHAR(255),
    prescription TEXT,
    CONSTRAINT fk_medical_records_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 2. Create Reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    ai_summary TEXT,
    file_data BYTEA,
    file_name VARCHAR(255),
    file_type VARCHAR(255),
    upload_date DATE,
    CONSTRAINT fk_reports_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
-- Profile Photo Support
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_picture BYTEA;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS profile_picture BYTEA;

-- 3. Create Patient-Doctor junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS patient_doctors (
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    PRIMARY KEY (patient_id, doctor_id),
    CONSTRAINT fk_pd_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_pd_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- 4. Create Password Reset Tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    expiry_date TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
