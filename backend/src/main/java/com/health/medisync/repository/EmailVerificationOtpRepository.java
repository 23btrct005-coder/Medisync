package com.health.medisync.repository;

import com.health.medisync.model.EmailVerificationOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmailVerificationOtpRepository extends JpaRepository<EmailVerificationOtp, Long> {
    Optional<EmailVerificationOtp> findByEmail(String email);
    void deleteByEmail(String email);
}
