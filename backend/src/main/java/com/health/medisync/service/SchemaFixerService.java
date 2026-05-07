package com.health.medisync.service;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SchemaFixerService {

    private final JdbcTemplate jdbcTemplate;

    public SchemaFixerService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void fixSchema() {
        try {
            System.out.println("🔧 MediSync Clinical Schema Audit Started...");
            jdbcTemplate.execute("ALTER TABLE appointments ALTER COLUMN doctor_id DROP NOT NULL");
            System.out.println("✅ Schema Corrected: Institutional appointments now support physician-free booking.");
        } catch (Exception e) {
            System.out.println("ℹ️ Schema Fix Skipped (Already applied or insufficient permissions): " + e.getMessage());
        }
    }
}
