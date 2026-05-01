package com.health.medisync.service;

import com.health.medisync.model.ChatMessage;
import com.health.medisync.repository.ChatMessageRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ChatMessageRepository chatMessageRepository, SimpMessagingTemplate messagingTemplate) {
        this.chatMessageRepository = chatMessageRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public ChatMessage sendMessage(ChatMessage message) {
        ChatMessage saved = chatMessageRepository.save(message);
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
}
