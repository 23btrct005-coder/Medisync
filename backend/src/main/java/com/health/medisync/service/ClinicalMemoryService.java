package com.health.medisync.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class ClinicalMemoryService {
    
    // In a production app, this would be backed by Redis or a Database
    private final Map<String, List<Map<String, String>>> conversationMemory = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> clinicalState = new ConcurrentHashMap<>();

    public void storeMessage(String sessionId, String role, String content) {
        conversationMemory.computeIfAbsent(sessionId, k -> new ArrayList<>())
                .add(Map.of("role", role, "content", content));
    }

    public List<Map<String, String>> getHistory(String sessionId) {
        return conversationMemory.getOrDefault(sessionId, new ArrayList<>());
    }

    public void updateClinicalState(String sessionId, Map<String, Object> state) {
        clinicalState.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>())
                .putAll(state);
    }

    public Map<String, Object> getClinicalState(String sessionId) {
        return clinicalState.getOrDefault(sessionId, new HashMap<>());
    }
}
