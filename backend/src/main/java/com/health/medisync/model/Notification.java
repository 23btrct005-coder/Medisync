package com.health.medisync.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String type; // AI_ANALYSIS, SECURITY, ACCESS, APPOINTMENT, SYSTEM

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String actionLink;
    private String actionText;

    private boolean isRead = false;

    private Instant createdAt;

    public Notification() {}

    public Notification(Long id, Long userId, String type, String title, String description, String actionLink, String actionText, boolean isRead, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.description = description;
        this.actionLink = actionLink;
        this.actionText = actionText;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    // Getters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getActionLink() { return actionLink; }
    public String getActionText() { return actionText; }
    public boolean isRead() { return isRead; }
    public Instant getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setType(String type) { this.type = type; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setActionLink(String actionLink) { this.actionLink = actionLink; }
    public void setActionText(String actionText) { this.actionText = actionText; }
    public void setRead(boolean read) { isRead = read; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
