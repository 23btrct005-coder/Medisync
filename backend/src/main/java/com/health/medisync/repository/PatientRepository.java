package com.health.medisync.repository;

import com.health.medisync.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUserId(Long userId);
    Optional<Patient> findByUserUsernameIgnoreCase(String username);
    Optional<Patient> findByPatientId(String patientId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Patient p WHERE LOWER(p.user.username) = LOWER(:email)")
    java.util.List<Patient> findAllByEmail(@org.springframework.data.repository.query.Param("email") String email);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Patient p LEFT JOIN p.doctors d " +
            "WHERE d.id = :doctorId OR p.id IN (SELECT ar.patient.id FROM AccessRequest ar WHERE ar.doctor.id = :doctorId AND ar.status IN ('ACCEPTED', 'APPROVED'))")
    java.util.List<Patient> findByDoctorId(@org.springframework.data.repository.query.Param("doctorId") Long doctorId);

    default Optional<Patient> findByEmail(String email) {
        java.util.List<Patient> list = findAllByEmail(email);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
