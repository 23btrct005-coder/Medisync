package com.health.medisync.repository;

import com.health.medisync.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    Optional<Doctor> findByEmail(String email);
    java.util.List<Doctor> findByApprovedFalse();

    @org.springframework.data.jpa.repository.Query(value = "SELECT id, user_id, name, gender, date_of_birth, age, email, phone, alternate_phone, specialization, medical_degree, additional_certifications, college, medical_license_number, hospital, years_of_experience, consultation_fee, online_consultation_fee, offline_consultation_fee, clinic_address, working_days, consultation_timings, online_consultation, approved, appointments_enabled, razorpay_account_id, profile_picture_url FROM doctors WHERE approved = false", nativeQuery = true)
    List<Doctor> findPendingHardened();
    @org.springframework.data.jpa.repository.Query(value = "SELECT id, user_id, name, gender, date_of_birth, age, email, phone, alternate_phone, specialization, medical_degree, additional_certifications, college, medical_license_number, hospital, years_of_experience, consultation_fee, online_consultation_fee, offline_consultation_fee, clinic_address, working_days, consultation_timings, online_consultation, approved, appointments_enabled, razorpay_account_id, profile_picture_url FROM doctors WHERE approved = true", nativeQuery = true)
    java.util.List<Doctor> findByApprovedTrue();
}
