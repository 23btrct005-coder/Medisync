package com.health.medisync.repository;

import com.health.medisync.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("SELECT m FROM ChatMessage m WHERE (m.senderId = :u1 AND m.receiverId = :u2) OR (m.senderId = :u2 AND m.receiverId = :u1) ORDER BY m.timestamp ASC")
    List<ChatMessage> findConversation(@Param("u1") Long u1, @Param("u2") Long u2);
    
    List<ChatMessage> findByReceiverIdAndIsReadFalse(Long receiverId);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteBySenderIdOrReceiverId(Long senderId, Long receiverId);
}
