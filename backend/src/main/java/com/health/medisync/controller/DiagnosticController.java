package com.health.medisync.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/diag")
public class DiagnosticController {
    private final JdbcTemplate jdbcTemplate;

    public DiagnosticController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/fix-sequences")
    public String fixSequences() {
        try {
            jdbcTemplate.execute("SELECT setval('chat_messages_id_seq', (SELECT MAX(id) FROM chat_messages))");
            return "SUCCESS: Chat sequences synchronized.";
        } catch (Exception e) {
            return "FAILURE: " + e.getMessage();
        }
    }
}
