package com.health.medisync.controller;

import com.health.medisync.model.Notification;
import com.health.medisync.repository.NotificationRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.security.UserContext;
import com.health.medisync.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/test")
    public ResponseEntity<?> sendTestNotification(Authentication authentication) {
        userRepository.findByUsernameIgnoreCase(authentication.getName()).ifPresent(user -> {
            notificationService.sendNotification(
                user.getId(),
                "SYSTEM",
                "Clinical Pulse Test",
                "MediSync real-time telemetry link is active. Signal verified.",
                "/dashboard",
                "Verification Link"
            );
        });
        return ResponseEntity.ok("Test Signal Transmitting...");
    }

    @GetMapping
    public ResponseEntity<?> getMyNotifications() {
        try {
            Long userId = UserContext.getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(List.of());
            }
            return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));
        } catch (Exception e) {
            System.err.println("CRITICAL: Notification fetch failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal signal error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Long userId = UserContext.getCurrentUserId();
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        Long userId = UserContext.getCurrentUserId();
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                notificationRepository.delete(n);
            }
        });
        return ResponseEntity.ok().build();
    }
}
