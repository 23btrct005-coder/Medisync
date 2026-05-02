package com.health.medisync.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

@Service
public class DatabaseSchemaService {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Ensures all production-level clinical columns exist in the database.
     * This method runs on startup and can be called manually if schema drift is detected.
     */
    @PostConstruct
    public void selfHealSchema() {
        try {
            System.out.println("INFO: Running Database Schema Self-Heal...");

            // Hospital Admin Table Updates
            jdbcTemplate.execute("ALTER TABLE hospital_admins ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS registration_certificate_url TEXT");

            // Doctor Table Updates - Core Legitimacy
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS medical_council TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS license_expiry_date TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS license_document_url TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS registration_year INTEGER");

            // Doctor Table Updates - Clinical Expertise
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS sub_specialties TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS procedures_handled TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS treatment_focus TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS languages_spoken TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS publications TEXT");

            // Doctor Table Updates - Advanced Availability
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS slot_duration INTEGER DEFAULT 15");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS max_patients_per_day INTEGER DEFAULT 50");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS break_timings TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS online_consultation_fee DOUBLE PRECISION");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS offline_consultation_fee DOUBLE PRECISION");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_address TEXT");

            // Doctor Table Updates - Permissions
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS can_prescribe BOOLEAN DEFAULT TRUE");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS can_edit_patient_data BOOLEAN DEFAULT TRUE");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS can_access_reports BOOLEAN DEFAULT TRUE");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS can_manage_appointments BOOLEAN DEFAULT TRUE");

            // Doctor Table Updates - HR & Institutional Mapping
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS salary TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'PERMANENT'");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS joining_date TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS staff_id TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS revenue_share_percentage DOUBLE PRECISION");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS employee_id TEXT");
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS opd_room_number TEXT");

            // Audit Log Table Updates
            try {
                jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN target_patient_id DROP NOT NULL");
            } catch (Exception e) {
                // Ignore if column doesn't exist yet or other schema issues
            }

            System.out.println("INFO: Database Schema Self-Heal completed successfully.");
        } catch (Exception e) {
            System.err.println("WARNING: Database Schema Self-Heal skipped or partially failed: " + e.getMessage());
        }
    }
}
