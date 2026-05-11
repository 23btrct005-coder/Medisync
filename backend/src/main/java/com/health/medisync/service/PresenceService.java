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
    private final com.health.medisync.repository.UserRepository userRepository;

    public PresenceService(com.health.medisync.repository.UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void userConnected(Long userId, String sessionId) {
        userSessions.computeIfAbsent(userId, k -> Collections.synchronizedSet(new java.util.HashSet<>())).add(sessionId);
        updateLastActive(userId);
    }

    public void userDisconnected(String sessionId) {
        Long disconnectedUserId = null;
        for (Map.Entry<Long, Set<String>> entry : userSessions.entrySet()) {
            if (entry.getValue().contains(sessionId)) {
                entry.getValue().remove(sessionId);
                if (entry.getValue().isEmpty()) {
                    disconnectedUserId = entry.getKey();
                }
                break;
            }
        }
        if (disconnectedUserId != null) {
            userSessions.remove(disconnectedUserId);
            updateLastActive(disconnectedUserId);
        }
    }

    private void updateLastActive(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastActive(java.time.LocalDateTime.now());
            userRepository.save(user);
        });
    }

    public boolean isUserOnline(Long userId) {
        return userSessions.containsKey(userId) && !userSessions.get(userId).isEmpty();
    }
}
