package com.health.medisync.service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.health.medisync.model.ChatMessage;
import com.health.medisync.model.ChatMessageDTO;
import com.health.medisync.model.User;
import com.health.medisync.repository.ChatMessageRepository;
import com.health.medisync.repository.UserRepository;

@Service
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final IdentityService identityService;

    public ChatService(ChatMessageRepository chatMessageRepository, SimpMessagingTemplate messagingTemplate, 
                       NotificationService notificationService, UserRepository userRepository,
                       IdentityService identityService) {
        this.chatMessageRepository = chatMessageRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.identityService = identityService;
    }

    @Transactional
    public ChatMessageDTO sendMessage(ChatMessage message) {
        ChatMessage saved = chatMessageRepository.save(message);
        
        // Resolve Identity for the sender
        Map<String, String> senderIdentity = identityService.resolveIdentity(message.getSenderId());
        ChatMessageDTO dto = new ChatMessageDTO(saved, senderIdentity.get("name"), senderIdentity.get("image"));

        // Fetch Receiver Username for WebSocket routing
        User receiver = userRepository.findById(message.getReceiverId())
            .orElseThrow(() -> new RuntimeException("Receiver not found"));

        // Notify Receiver (System Alert)
        notificationService.sendNotification(
            message.getReceiverId(),
            "CHAT",
            "New Clinical Message",
            senderIdentity.get("name") + ": " + (message.getContent().length() > 50 ? message.getContent().substring(0, 47) + "..." : message.getContent()),
            "/dashboard/messages",
            "Open Chat"
        );

        // Real-time dispatch via WebSockets (Using Username as Principal)
        messagingTemplate.convertAndSendToUser(
            receiver.getUsername(), 
            "/queue/messages", 
            dto
        );
        return dto;
    }

    public List<ChatMessageDTO> getConversation(Long u1, Long u2) {
        List<ChatMessage> messages = chatMessageRepository.findConversation(u1, u2);
        
        // Cache identities for this conversation to avoid redundant lookups
        Map<Long, Map<String, String>> identityCache = new HashMap<>();
        
        return messages.stream().map(m -> {
            Map<String, String> identity = identityCache.computeIfAbsent(m.getSenderId(), identityService::resolveIdentity);
            return new ChatMessageDTO(m, identity.get("name"), identity.get("image"));
        }).toList();
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
