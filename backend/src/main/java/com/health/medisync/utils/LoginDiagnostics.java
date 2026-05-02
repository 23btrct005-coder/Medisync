package com.health.medisync.utils;

import com.health.medisync.model.User;
import com.health.medisync.model.Doctor;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.DoctorRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class LoginDiagnostics implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;

    public LoginDiagnostics(UserRepository userRepository, DoctorRepository doctorRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        String targetEmail = "abhi0925abhishek@gmail.com";
        System.out.println("DIAGNOSTIC: Checking user " + targetEmail);
        
        userRepository.findByUsernameIgnoreCase(targetEmail).ifPresentOrElse(
            u -> System.out.println("DIAGNOSTIC: User found in users table. Role: " + u.getRole() + ", Enabled: " + u.isEnabled()),
            () -> System.out.println("DIAGNOSTIC: User NOT found in users table by username.")
        );

        doctorRepository.findFirstByEmail(targetEmail).ifPresentOrElse(
            d -> System.out.println("DIAGNOSTIC: Doctor found in doctors table. Approved: " + d.isApproved() + ", User Link: " + (d.getUser() != null ? d.getUser().getUsername() : "NULL")),
            () -> System.out.println("DIAGNOSTIC: Doctor NOT found in doctors table by email.")
        );
    }
}
