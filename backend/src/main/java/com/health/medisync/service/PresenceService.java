package com.health.medisync.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.Set;
import java.util.Collections;

@Service
public class PresenceService {
    // Tracks userId -> Set of sessionIds
    private final Map<Long, Set<String>> userSessions = new ConcurrentHashMap<>();

    public void userConnected(Long userId, String sessionId) {
        userSessions.computeIfAbsent(userId, k -> Collections.synchronizedSet(new java.util.HashSet<>())).add(sessionId);
    }

    public void userDisconnected(String sessionId) {
        userSessions.values().forEach(sessions -> sessions.remove(sessionId));
        // Cleanup empty sets
        userSessions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }

    public boolean isUserOnline(Long userId) {
        return userSessions.containsKey(userId) && !userSessions.get(userId).isEmpty();
    }
}
