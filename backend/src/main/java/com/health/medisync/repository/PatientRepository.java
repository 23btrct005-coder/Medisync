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

    @org.springframework.data.jpa.repository.Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Patient p LEFT JOIN p.doctors d " +
            "WHERE p.id = :patientId AND (d.id = :doctorId " +
            "OR p.id IN (SELECT ar.patient.id FROM AccessRequest ar WHERE ar.doctor.id = :doctorId AND ar.status IN ('ACCEPTED', 'APPROVED')) " +
            "OR p.id IN (SELECT a.patient.id FROM Appointment a WHERE a.doctor.id = :doctorId AND a.status IN ('BOOKED', 'AWAITING_VERIFICATION')))")
    boolean checkDoctorLink(@org.springframework.data.repository.query.Param("doctorId") Long doctorId, 
                           @org.springframework.data.repository.query.Param("patientId") Long patientId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Patient p LEFT JOIN p.doctors d " +
            "WHERE d.id = :doctorId " +
            "OR p.id IN (SELECT ar.patient.id FROM AccessRequest ar WHERE ar.doctor.id = :doctorId AND ar.status IN ('ACCEPTED', 'APPROVED')) " +
            "OR p.id IN (SELECT a.patient.id FROM Appointment a WHERE a.doctor.id = :doctorId AND a.status IN ('BOOKED', 'AWAITING_VERIFICATION'))")
    java.util.List<Patient> findByDoctorIdAndUserId(@org.springframework.data.repository.query.Param("doctorId") Long doctorId, @org.springframework.data.repository.query.Param("userId") Long userId);

    default Optional<Patient> findByEmail(String email) {
        java.util.List<Patient> list = findAllByEmail(email);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
