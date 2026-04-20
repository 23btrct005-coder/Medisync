package com.health.medisync.repository;

import com.health.medisync.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    Optional<Doctor> findByEmail(String email);
    java.util.List<Doctor> findByApprovedFalse();

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM doctors WHERE approved = false", nativeQuery = true)
    List<Doctor> findPendingHardened();
    java.util.List<Doctor> findByApprovedTrue();
}
