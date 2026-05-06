package com.health.medisync.repository;

import com.health.medisync.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    
    @Query("SELECT p FROM Prescription p WHERE p.patient.user.username = :email AND p.isActive = true")
    List<Prescription> findByPatientEmailAndIsActiveTrue(@Param("email") String email);
    
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Prescription> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    void deleteByDoctorId(Long doctorId);
}
