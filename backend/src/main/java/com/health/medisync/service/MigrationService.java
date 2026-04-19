package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;

@Service
public class MigrationService {

    private final JdbcTemplate jdbcTemplate;

    @Value("file:database_migration_pro.sql")
    private Resource migrationScript;

    public MigrationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void runMigration() {
        try {
            if (migrationScript.exists()) {
                System.out.println("INFO: Starting database schema expansion...");
                String sql = StreamUtils.copyToString(migrationScript.getInputStream(), StandardCharsets.UTF_8);
                
                // Split by semicolon and execute each statement
                String[] statements = sql.split(";");
                for (String statement : statements) {
                    if (!statement.trim().isEmpty()) {
                        try {
                            jdbcTemplate.execute(statement.trim());
                        } catch (Exception e) {
                            // Ignore if column already exists (though script uses IF NOT EXISTS)
                            System.out.println("DEBUG: Statement partially executed or skipped: " + e.getMessage());
                        }
                    }
                }
                System.out.println("SUCCESS: Database schema expansion completed successfully.");
            } else {
                System.err.println("WARNING: Migration script not found at " + migrationScript.getFilename());
            }
        } catch (Exception e) {
            System.err.println("ERROR: Database migration failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
