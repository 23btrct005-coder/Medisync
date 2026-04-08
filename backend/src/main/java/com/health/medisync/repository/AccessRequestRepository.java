package com.health.medisync.repository;

import com.health.medisync.model.AccessRequest;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AccessRequestRepository extends JpaRepository<AccessRequest, Long> {
    List<AccessRequest> findByPatientAndStatus(Patient patient, String status);
    Optional<AccessRequest> findByDoctorAndPatient(Doctor doctor, Patient patient);
}
