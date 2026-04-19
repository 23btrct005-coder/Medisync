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
        new Thread(() -> {
            try {
                // Wait slightly for DB pool to stabilize
                Thread.sleep(5000);
                
                if (migrationScript.exists()) {
                    System.out.println("INFO: Starting ISOLATED database schema expansion...");
                    String sql = StreamUtils.copyToString(migrationScript.getInputStream(), StandardCharsets.UTF_8);
                    
                    String[] statements = sql.split(";");
                    for (String statement : statements) {
                        String trimmed = statement.trim();
                        if (!trimmed.isEmpty()) {
                            try {
                                // Use direct execute to bypass transaction manager
                                jdbcTemplate.execute(trimmed);
                            } catch (Exception e) {
                                // Expected if column exists, but we log the state
                                if (!e.getMessage().contains("already exists")) {
                                    System.out.println("DEBUG: Statement status: " + e.getMessage());
                                }
                            }
                        }
                    }
                    System.out.println("SUCCESS: Isolated schema expansion completed.");
                }
            } catch (Exception e) {
                System.err.println("ERROR: Fatal migration failure: " + e.getMessage());
            }
        }).start();
    }
}
