package com.health.medisync.repository;

import com.health.medisync.model.Telemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {
    List<Telemetry> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Telemetry> findTop5ByPatientIdOrderByCreatedAtDesc(Long patientId);
}
