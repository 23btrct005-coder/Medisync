package com.health.medisync.model;

import java.time.Instant;

public class ChatMessageDTO {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String content;
    private Instant timestamp;
    private boolean isRead;
    private String senderName;
    private String senderImage;

    public ChatMessageDTO() {}

    public ChatMessageDTO(ChatMessage m, String senderName, String senderImage) {
        this.id = m.getId();
        this.senderId = m.getSenderId();
        this.receiverId = m.getReceiverId();
        this.content = m.getContent();
        this.timestamp = m.getTimestamp();
        this.isRead = m.isRead();
        this.senderName = senderName;
        this.senderImage = senderImage;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getSenderImage() { return senderImage; }
    public void setSenderImage(String senderImage) { this.senderImage = senderImage; }
}
