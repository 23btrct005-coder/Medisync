package com.health.medisync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Redis-Backed Clinical Memory Engine
 * Provides persistent, session-aware medical context across distributed hospital nodes.
 */
@Service
public class ClinicalMemoryEngine {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private static final String MEMORY_PREFIX = "medisync:memory:";
    private static final String STATE_PREFIX = "medisync:state:";

    public ClinicalMemoryEngine(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public void storeMessage(String sessionId, String role, String content) {
        String key = MEMORY_PREFIX + sessionId;
        Map<String, String> message = Map.of(
            "role", role, 
            "content", content,
            "timestamp", String.valueOf(System.currentTimeMillis())
        );
        try {
            redisTemplate.opsForList().rightPush(key, objectMapper.writeValueAsString(message));
            redisTemplate.expire(key, 24, TimeUnit.HOURS); // Session TTL
        } catch (Exception e) {
            System.err.println("REDIS_MEMORY_ERROR: " + e.getMessage());
        }
    }

    public List<Map<String, String>> getHistory(String sessionId) {
        String key = MEMORY_PREFIX + sessionId;
        List<String> rawHistory = redisTemplate.opsForList().range(key, 0, -1);
        List<Map<String, String>> history = new ArrayList<>();
        
        if (rawHistory != null) {
            for (String raw : rawHistory) {
                try {
                    history.add(objectMapper.readValue(raw, Map.class));
                } catch (Exception ignored) {}
            }
        }
        return history;
    }

    public void updateMedicalState(String sessionId, Map<String, Object> state) {
        String key = STATE_PREFIX + sessionId;
        try {
            String currentStateRaw = redisTemplate.opsForValue().get(key);
            Map<String, Object> currentState = currentStateRaw != null ? 
                objectMapper.readValue(currentStateRaw, Map.class) : new HashMap<>();
            
            currentState.putAll(state);
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(currentState));
            redisTemplate.expire(key, 24, TimeUnit.HOURS);
        } catch (Exception e) {
            System.err.println("REDIS_STATE_ERROR: " + e.getMessage());
        }
    }

    public Map<String, Object> getMedicalState(String sessionId) {
        String key = STATE_PREFIX + sessionId;
        try {
            String raw = redisTemplate.opsForValue().get(key);
            return raw != null ? objectMapper.readValue(raw, Map.class) : new HashMap<>();
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public void compressContext(String sessionId) {
        // Placeholder for AI-driven summarization to keep token window efficient
        // This would involve calling a summarization agent and replacing list history with a summary
    }
}
