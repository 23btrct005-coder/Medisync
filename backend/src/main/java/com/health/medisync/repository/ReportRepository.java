package com.health.medisync.repository;

import com.health.medisync.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByPatientId(Long patientId);
    java.util.Optional<Report> findTopByPatientIdOrderByDocumentDateDesc(Long patientId);
}
