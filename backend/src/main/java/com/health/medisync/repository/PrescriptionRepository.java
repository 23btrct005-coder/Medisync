package com.health.medisync.repository;

import com.health.medisync.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientEmailAndIsActiveTrue(String email);
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Prescription> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
}
