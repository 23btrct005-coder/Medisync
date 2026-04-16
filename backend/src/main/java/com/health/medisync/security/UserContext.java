package com.health.medisync.security;

import org.springframework.stereotype.Component;

@Component
public class UserContext {
    private static final ThreadLocal<Long> currentUserId = new ThreadLocal<>();
    private static final ThreadLocal<String> currentUserRole = new ThreadLocal<>();

    public static void setContext(Long userId, String role) {
        currentUserId.set(userId);
        currentUserRole.set(role);
    }

    public static Long getCurrentUserId() {
        return currentUserId.get();
    }

    public static String getCurrentUserRole() {
        return currentUserRole.get();
    }

    public static void clear() {
        currentUserId.remove();
        currentUserRole.remove();
    }
}
