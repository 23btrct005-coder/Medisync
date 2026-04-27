package com.health.medisync.repository;

import com.health.medisync.model.HospitalAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HospitalAdminRepository extends JpaRepository<HospitalAdmin, Long> {
    Optional<HospitalAdmin> findByUserId(Long userId);
    Optional<HospitalAdmin> findByUserUsernameIgnoreCase(String username);
}
