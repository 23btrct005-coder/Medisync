package com.health.medisync.repository;

import com.health.medisync.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    Optional<Doctor> findFirstByEmail(String email);
    Optional<Doctor> findByEmail(String email);
    Optional<Doctor> findFirstByMedicalLicenseNumber(String medicalLicenseNumber);
    java.util.List<Doctor> findByApprovedFalse();
    Optional<Doctor> findFirstByEmployeeId(String employeeId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM doctors WHERE approved = false", nativeQuery = true)
    List<Doctor> findPendingHardened();
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM doctors WHERE approved = true", nativeQuery = true)
    java.util.List<Doctor> findByApprovedTrue();

    @org.springframework.data.jpa.repository.Query("SELECT d FROM Doctor d WHERE d.approved = true AND (LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', :query, '%')))")
    java.util.List<Doctor> searchDoctors(@org.springframework.data.repository.query.Param("query") String query);

    java.util.List<Doctor> findByHospitalEntity(com.health.medisync.model.Hospital hospital);
}
