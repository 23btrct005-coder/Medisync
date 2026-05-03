package com.health.medisync.repository;

import com.health.medisync.model.AiQueryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiQueryLogRepository extends JpaRepository<AiQueryLog, Long> {
    List<AiQueryLog> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);
}
