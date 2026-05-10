package com.health.medisync.repository;

import com.health.medisync.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    Optional<Hospital> findByLicenseCode(String licenseCode);
    Optional<Hospital> findByNameContainingIgnoreCase(String name);
}
