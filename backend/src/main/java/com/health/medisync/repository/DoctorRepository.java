package com.health.medisync.repository;

import com.health.medisync.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    Optional<Doctor> findByEmail(String email);
}
