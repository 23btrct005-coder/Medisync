package com.health.medisync.service;

import com.health.medisync.model.Notification;
import com.health.medisync.model.User;
import com.health.medisync.repository.NotificationRepository;
import com.health.medisync.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, 
                               SimpMessagingTemplate messagingTemplate,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    @Transactional
    public void sendNotification(Long userId, String type, String title, String description) {
        sendNotification(userId, type, title, description, null, null);
    }

    @Transactional
    public void sendNotification(Long userId, String type, String title, String description, String actionLink, String actionText) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setDescription(description);
        notification.setActionLink(actionLink);
        notification.setActionText(actionText);
        notification.setRead(false);

        Notification saved = notificationRepository.save(notification);

        // Push via WebSocket
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            // Send to user-specific queue: /user/{username}/queue/notifications
            messagingTemplate.convertAndSendToUser(
                user.getUsername(), 
                "/queue/notifications", 
                saved
            );
        }
    }
}
