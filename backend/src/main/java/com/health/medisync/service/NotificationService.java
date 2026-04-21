package com.health.medisync.service;

import com.health.medisync.model.Notification;
import com.health.medisync.model.User;
import com.health.medisync.model.Patient;
import com.health.medisync.repository.NotificationRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.PatientRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final SmsService smsService;
    private final VoiceService voiceService;

    public NotificationService(NotificationRepository notificationRepository, 
                               SimpMessagingTemplate messagingTemplate,
                               UserRepository userRepository,
                               PatientRepository patientRepository,
                               SmsService smsService,
                               VoiceService voiceService) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.smsService = smsService;
        this.voiceService = voiceService;
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
            
            // 📱 SMS BRIDGE: Trigger text alert for Clinical events if preference enabled
            if ("APPOINTMENT".equals(type) || "AI_ANALYSIS".equals(type)) {
                patientRepository.findByUserId(userId).ifPresent(patient -> {
                    if (patient.getSmsNotifications() != null && patient.getSmsNotifications() && 
                        patient.getPhone() != null && !patient.getPhone().isEmpty()) {
                        
                        String smsBody = "MediSync: [" + title + "] " + description;
                        smsService.sendSms(patient.getPhone(), smsBody);
                        
                        // 🎙️ VOICE BRIDGE: Trigger automated call for high-priority APPOINTMENTS
                        if ("APPOINTMENT".equals(type)) {
                            String voiceMessage = "You have a clinical update: " + title + ". " + description;
                            voiceService.initiateVoiceAlert(patient.getPhone(), voiceMessage);
                        }
                    }
                });
            }
        }
    }
}
