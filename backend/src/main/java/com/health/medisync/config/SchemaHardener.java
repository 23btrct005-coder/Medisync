package com.health.medisync.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class SchemaHardener {
    private static final Logger logger = LoggerFactory.getLogger(SchemaHardener.class);

    @Bean
    public CommandLineRunner migrateSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            logger.info("Starting Institutional Schema Hardening...");
            try {
                // Add new columns to doctors table if they don't exist
                String[] columns = {
                    "medical_council VARCHAR(255)",
                    "license_expiry_date VARCHAR(255)",
                    "license_document_url VARCHAR(255)",
                    "registration_year INTEGER",
                    "sub_specialties VARCHAR(255)",
                    "procedures_handled VARCHAR(255)",
                    "treatment_focus VARCHAR(255)",
                    "languages_spoken VARCHAR(255)",
                    "publications VARCHAR(255)",
                    "slot_duration INTEGER",
                    "slot_buffer INTEGER DEFAULT 0",
                    "max_patients_per_day INTEGER",
                    "break_timings VARCHAR(255)",
                    "institutional BOOLEAN DEFAULT FALSE",
                    "employee_id VARCHAR(255)",
                    "opd_room_number VARCHAR(255)",
                    "staff_id VARCHAR(255)",
                    "joining_date VARCHAR(255)",
                    "salary VARCHAR(255)",
                    "contract_type VARCHAR(255)"
                };

                for (String col : columns) {
                    String colName = col.split(" ")[0];
                    try {
                        jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS " + col);
                        logger.info("Checked/Added column: " + colName);
                    } catch (Exception e) {
                        logger.warn("Could not add column " + colName + ": " + e.getMessage());
                    }
                }
                
                logger.info("Schema Hardening Complete.");
            } catch (Exception e) {
                logger.error("Schema Hardening Failed: " + e.getMessage());
            }
        };
    }
}
