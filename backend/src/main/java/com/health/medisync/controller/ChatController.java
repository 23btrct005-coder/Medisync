package com.health.medisync.controller;

import com.health.medisync.model.ChatMessage;
import com.health.medisync.model.ChatMessageDTO;
import com.health.medisync.model.User;
import com.health.medisync.service.ChatService;
import com.health.medisync.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    
    @GetMapping("/ping")
    public String ping() { return "Chat Node Active"; }

    private final ChatService chatService;
    private final UserRepository userRepository;
    private final com.health.medisync.service.PresenceService presenceService;

    public ChatController(ChatService chatService, UserRepository userRepository, 
                          com.health.medisync.service.PresenceService presenceService) {
        this.chatService = chatService;
        this.userRepository = userRepository;
        this.presenceService = presenceService;
    }

    @GetMapping("/conversation/{receiverId}")
    public ResponseEntity<?> getConversation(
            @PathVariable String receiverId, 
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (receiverId == null || receiverId.equalsIgnoreCase("undefined")) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid receiver identifier"));
            }
            Long rid = Long.valueOf(receiverId.split("\\.")[0]);
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(chatService.getConversation(user.getId(), rid));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/send")
    public ResponseEntity<ChatMessageDTO> sendMessage(
            @RequestBody ChatMessage message, 
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        message.setSenderId(user.getId());
        return ResponseEntity.ok(chatService.sendMessage(message));
    }

    @PostMapping("/mark-read/{senderId}")
    public ResponseEntity<?> markAsRead(
            @PathVariable String senderId, 
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (senderId == null || senderId.equalsIgnoreCase("undefined")) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid sender identifier"));
            }
            Long sid = Long.valueOf(senderId.split("\\.")[0]);
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            chatService.markAsRead(user.getId(), sid);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/unread-counts")
    public ResponseEntity<java.util.Map<Long, Long>> getUnreadCounts(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(chatService.getUnreadCounts(user.getId()));
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<?> getUserStatus(@PathVariable String userId) {
        try {
            if (userId == null || userId.equalsIgnoreCase("undefined")) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid user identifier"));
            }
            Long uid = Long.valueOf(userId.split("\\.")[0]);
            boolean online = presenceService.isUserOnline(uid);
            return ResponseEntity.ok(java.util.Map.of("online", online));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}
