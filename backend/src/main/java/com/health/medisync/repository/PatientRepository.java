package com.health.medisync.repository;

import com.health.medisync.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUserId(Long userId);
    Optional<Patient> findByUserUsernameIgnoreCase(String username);
    Optional<Patient> findByPatientId(String patientId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Patient p WHERE LOWER(p.user.username) = LOWER(:email)")
    Optional<Patient> findByEmail(@org.springframework.data.repository.query.Param("email") String email);
}
