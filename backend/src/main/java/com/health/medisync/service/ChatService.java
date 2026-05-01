package com.health.medisync.service;

import com.health.medisync.model.ChatMessage;
import com.health.medisync.repository.ChatMessageRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final NotificationService notificationService;

    public ChatService(ChatMessageRepository chatMessageRepository, SimpMessagingTemplate messagingTemplate, NotificationService notificationService) {
        this.chatMessageRepository = chatMessageRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
    }

    @Transactional
    public ChatMessage sendMessage(ChatMessage message) {
        ChatMessage saved = chatMessageRepository.save(message);
        
        // Notify Receiver
        notificationService.sendNotification(
            message.getReceiverId(),
            "CHAT",
            "New Clinical Message",
            "You have a new secure message: " + (message.getContent().length() > 50 ? message.getContent().substring(0, 47) + "..." : message.getContent()),
            "/doctor-dashboard/messages", // Will be contextualized in frontend
            "Open Chat"
        );

        // Real-time dispatch via WebSockets
        messagingTemplate.convertAndSendToUser(
            String.valueOf(message.getReceiverId()), 
            "/queue/messages", 
            saved
        );
        return saved;
    }

    public List<ChatMessage> getConversation(Long u1, Long u2) {
        return chatMessageRepository.findConversation(u1, u2);
    }

    @Transactional
    public void markAsRead(Long receiverId, Long senderId) {
        List<ChatMessage> unread = chatMessageRepository.findByReceiverIdAndIsReadFalse(receiverId);
        for (ChatMessage msg : unread) {
            if (msg.getSenderId().equals(senderId)) {
                msg.setRead(true);
            }
        }
        chatMessageRepository.saveAll(unread);
    }

    public Map<Long, Long> getUnreadCounts(Long userId) {
        List<ChatMessage> unread = chatMessageRepository.findByReceiverIdAndIsReadFalse(userId);
        return unread.stream()
            .collect(Collectors.groupingBy(ChatMessage::getSenderId, Collectors.counting()));
    }
}
