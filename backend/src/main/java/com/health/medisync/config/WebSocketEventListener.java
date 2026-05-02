package com.health.medisync.config;

import com.health.medisync.model.User;
import com.health.medisync.service.PresenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    @Autowired
    private PresenceService presenceService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) headerAccessor.getUser();
        if (auth != null && auth.getPrincipal() instanceof com.health.medisync.model.User) {
            User user = (User) auth.getPrincipal();
            presenceService.userConnected(user.getId(), headerAccessor.getSessionId());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        presenceService.userDisconnected(headerAccessor.getSessionId());
    }
}
