package com.health.medisync;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Map;

@SpringBootApplication
public class DbAuditApplication implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public static void main(String[] args) {
        SpringApplication.run(DbAuditApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- DB COLUMN AUDIT ---");
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
            "SELECT table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%doctor_id%' AND table_schema = 'public'"
        );
        for (Map<String, Object> col : columns) {
            System.out.println("Table: " + col.get("table_name") + " | Column: " + col.get("column_name"));
        }
        System.out.println("--- END AUDIT ---");
    }
}
