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
    @GetMapping("/inspect-chat-sequence")
    public java.util.Map<String, Object> inspectChatSequence() {
        try {
            Long maxId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM chat_messages", Long.class);
            Long nextVal = jdbcTemplate.queryForObject("SELECT last_value FROM chat_messages_id_seq", Long.class);
            return java.util.Map.of(
                "maxId", maxId != null ? maxId : 0,
                "nextVal", nextVal != null ? nextVal : 0,
                "synchronized", (maxId != null && nextVal != null && nextVal >= maxId)
            );
        } catch (Exception e) {
            return java.util.Map.of("error", e.getMessage());
        }
    @GetMapping("/inspect-chat-schema")
    public java.util.List<java.util.Map<String, Object>> inspectChatSchema() {
        try {
            return jdbcTemplate.queryForList(
                "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'chat_messages'"
            );
        } catch (Exception e) {
            return java.util.List.of(java.util.Map.of("error", e.getMessage()));
        }
    }
}
