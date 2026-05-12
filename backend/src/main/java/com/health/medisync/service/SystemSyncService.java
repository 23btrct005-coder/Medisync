package com.health.medisync.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class SystemSyncService {

    private final SimpMessagingTemplate messagingTemplate;

    public SystemSyncService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * SYSTEM HEARTBEAT: Dispatches a high-precision clinical clock sync 
     * to all connected nodes every second. 
     * This maintains WebSocket connection integrity and provides a global 
     * 'Single Source of Truth' for time-sensitive clinical operations.
     */
    @Scheduled(fixedRate = 1000)
    public void broadcastSystemSync() {
        Map<String, Object> syncData = new HashMap<>();
        syncData.put("serverTime", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        syncData.put("status", "ACTIVE");
        syncData.put("node", "MEDISYNC-CORE-01");
        
        messagingTemplate.convertAndSend("/topic/system-sync", syncData);
    }
}
