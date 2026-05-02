package com.health.medisync.controller;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.User;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.health.medisync.model.DoctorDTO;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.ArrayList;
import java.io.StringWriter;
import java.io.PrintWriter;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final com.health.medisync.repository.HospitalAdminRepository hospitalAdminRepository;
    private final JdbcTemplate jdbcTemplate;

    public AdminController(DoctorRepository doctorRepository, UserRepository userRepository, 
                           com.health.medisync.repository.HospitalAdminRepository hospitalAdminRepository,
                           JdbcTemplate jdbcTemplate) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/hospitals/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPendingHospitals() {
        try {
            String sql = "SELECT ha.id, ha.name as admin_name, ha.position, h.name as hospital_name, h.license_code, h.city, h.state, h.street, h.pin_code, h.phone, h.contact_email, h.logo_url, h.registration_certificate_url, ha.approved " +
                         "FROM hospital_admins ha JOIN hospitals h ON ha.hospital_id = h.id WHERE ha.approved = false";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to fetch pending hospitals: " + e.getMessage()));
        }
    }

    @PostMapping("/hospitals/{id}/approve")
    public ResponseEntity<?> approveHospital(@PathVariable Long id) {
        return hospitalAdminRepository.findById(id).map(admin -> {
            admin.setApproved(true);
            User user = admin.getUser();
            if (user != null) {
                user.setEnabled(true);
                userRepository.save(user);
            }
            hospitalAdminRepository.save(admin);
            return ResponseEntity.ok(Map.of("message", "Hospital Administration approved successfully!"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "Hospital Admin with ID " + id + " not found in the registry.")));
    }

    @PostMapping("/hospitals/{id}/reject")
    public ResponseEntity<?> rejectHospital(@PathVariable Long id) {
        return hospitalAdminRepository.findById(id).map(admin -> {
            User user = admin.getUser();
            hospitalAdminRepository.delete(admin);
            if (user != null) {
                userRepository.delete(user);
            }
            return ResponseEntity.ok(Map.of("message", "Hospital Administration rejected."));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "Hospital Admin with ID " + id + " not found.")));
    }

    @GetMapping("/doctors/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPendingDoctors() {
        try {
            // Global Admin only approves independent doctors (hospitalEntity is null)
            // Institutional doctors are approved by their respective Hospital Admins
            List<Doctor> pending = doctorRepository.findByApprovedFalse();
            List<DoctorDTO> dtos = pending.stream()
                .filter(d -> d.getHospitalEntity() == null)
                .map(DoctorDTO::new)
                .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            PinpointDiagnosticController.setLastError("ADMIN_PENDING_ERROR: " + sw.toString());
            return ResponseEntity.status(500).body(Map.of("message", "Failed to fetch pending doctors: " + e.getMessage()));
        }
    }

    @PostMapping("/doctors/{id}/approve")
    public ResponseEntity<?> approveDoctor(@PathVariable Long id) {
        return doctorRepository.findById(id).map(doctor -> {
            doctor.setApproved(true);
            User user = doctor.getUser();
            if (user != null) {
                user.setEnabled(true);
                user.setRole("ROLE_DOCTOR");
                userRepository.save(user);
            }
            doctorRepository.save(doctor);
            return ResponseEntity.ok(Map.of("message", "Doctor approved successfully!"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "Physician with ID " + id + " not found in the clinical registry.")));
    }

    @PostMapping("/doctors/{id}/reject")
    public ResponseEntity<?> rejectDoctor(@PathVariable Long id) {
        return doctorRepository.findById(id).map(doctor -> {
            User user = doctor.getUser();
            doctorRepository.delete(doctor);
            if (user != null) {
                userRepository.delete(user);
            }
            return ResponseEntity.ok(Map.of("message", "Doctor application rejected and record removed."));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "Physician with ID " + id + " not found.")));
    }

    @GetMapping("/hospitals/all")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllHospitals() {
        try {
            String sql = "SELECT ha.id, ha.name as admin_name, ha.position, h.name as hospital_name, h.license_code, h.city, h.state, h.street, h.pin_code, h.phone, h.contact_email, h.logo_url, h.registration_certificate_url, ha.approved, u.enabled, u.id as user_id " +
                         "FROM hospital_admins ha " +
                         "JOIN hospitals h ON ha.hospital_id = h.id " +
                         "LEFT JOIN users u ON ha.user_id = u.id";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to fetch all hospitals: " + e.getMessage()));
        }
    }

    @GetMapping("/doctors/all")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllDoctors() {
        try {
            List<Doctor> doctors = doctorRepository.findAll();
            List<Map<String, Object>> result = doctors.stream().map(d -> {
                DoctorDTO dto = new DoctorDTO(d);
                // Add extra fields needed by frontend that might not be in DTO or handled differently
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", dto.getId());
                map.put("name", dto.getName());
                map.put("email", dto.getEmail());
                map.put("phone", dto.getPhone());
                map.put("specialization", dto.getSpecialization());
                map.put("medicalLicenseNumber", dto.getMedicalLicenseNumber());
                map.put("medicalCouncil", dto.getMedicalCouncil());
                map.put("licenseExpiryDate", dto.getLicenseExpiryDate());
                map.put("yearsOfExperience", dto.getYearsOfExperience());
                map.put("hospital", dto.getHospital());
                map.put("profilePictureUrl", dto.getProfilePictureUrl());
                map.put("approved", dto.isApproved());
                map.put("gender", dto.getGender());
                map.put("dateOfBirth", dto.getDateOfBirth());
                map.put("employeeId", dto.getEmployeeId());
                map.put("opdRoomNumber", dto.getOpdRoomNumber());
                map.put("contractType", dto.getContractType());
                map.put("salary", dto.getSalary());
                map.put("revenueSharePercentage", dto.getRevenueSharePercentage());
                map.put("upiId", dto.getUpiId());
                map.put("licenseDocumentUrl", dto.getLicenseDocumentUrl());
                map.put("clinicAddress", dto.getClinicAddress());
                map.put("clinicStreet", dto.getClinicStreet());
                map.put("clinicCity", dto.getClinicCity());
                map.put("clinicState", dto.getClinicState());
                map.put("clinicPinCode", dto.getClinicPinCode());
                map.put("workingDays", dto.getWorkingDays());
                map.put("consultationTimings", dto.getConsultationTimings());
                map.put("college", dto.getCollege());
                map.put("additionalCertifications", d.getAdditionalCertifications());
                map.put("subSpecialties", dto.getSubSpecialties());
                map.put("proceduresHandled", dto.getProceduresHandled());
                map.put("treatmentFocus", dto.getTreatmentFocus());
                map.put("languagesSpoken", dto.getLanguagesSpoken());
                map.put("publications", dto.getPublications());
                map.put("canPrescribe", dto.isCanPrescribe());
                map.put("canEditPatientData", dto.isCanEditPatientData());
                map.put("canAccessReports", dto.isCanAccessReports());
                map.put("canManageAppointments", dto.isCanManageAppointments());
                
                if (d.getUser() != null) {
                    map.put("enabled", d.getUser().isEnabled());
                    map.put("user_id", d.getUser().getId());
                }
                return map;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to fetch all doctors: " + e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/toggle")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            if ("ROLE_ADMIN".equals(user.getRole())) {
                return ResponseEntity.status(403).body(Map.of("message", "Administrative nodes cannot be toggled."));
            }
            user.setEnabled(!user.isEnabled());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User access " + (user.isEnabled() ? "granted" : "revoked") + " successfully."));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User node not found.")));
    }

    @PostMapping("/system/wipe")
    @Transactional
    public ResponseEntity<?> wipeSystem() {
        try {
            // Delete in order to satisfy foreign keys
            jdbcTemplate.execute("DELETE FROM appointments");
            jdbcTemplate.execute("DELETE FROM medical_records");
            jdbcTemplate.execute("DELETE FROM doctors");
            jdbcTemplate.execute("DELETE FROM hospital_admins");
            jdbcTemplate.execute("DELETE FROM hospitals");
            jdbcTemplate.execute("DELETE FROM patients");
            // Only delete users that are not the main admin
            jdbcTemplate.execute("DELETE FROM users WHERE role != 'ROLE_ADMIN'");
            
            return ResponseEntity.ok(Map.of("message", "System wiped successfully. All professional and patient data removed."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Wipe failed: " + e.getMessage()));
        }
    }
    @PostMapping("/doctors/{id}/purge")
    @Transactional
    public ResponseEntity<?> purgeDoctor(@PathVariable Long id) {
        return doctorRepository.findById(id).map(doctor -> {
            User user = doctor.getUser();
            
            // Cleanup related clinical data
            jdbcTemplate.update("DELETE FROM appointments WHERE doctor_id = ?", id);
            jdbcTemplate.update("DELETE FROM prescriptions WHERE doctor_id = ?", id);
            jdbcTemplate.update("DELETE FROM ratings WHERE doctor_id = ?", id);
            
            doctorRepository.delete(doctor);
            if (user != null) {
                userRepository.delete(user);
            }
            return ResponseEntity.ok(Map.of("message", "Physician record and all associated clinical data purged."));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "Physician not found.")));
    }

    @PostMapping("/hospitals/{id}/purge")
    @Transactional
    public ResponseEntity<?> purgeHospital(@PathVariable Long id) {
        return hospitalRepository.findById(id).map(hospital -> {
            // Find associated users via admins to clean up user accounts
            List<Long> adminUserIds = jdbcTemplate.queryForList(
                "SELECT user_id FROM hospital_admins WHERE hospital_id = ?", Long.class, id);
            
            // 1. Cleanup related clinical data via doctors in this hospital
            jdbcTemplate.update("DELETE FROM appointments WHERE doctor_id IN (SELECT id FROM doctors WHERE hospital_id = ?)", id);
            jdbcTemplate.update("DELETE FROM prescriptions WHERE doctor_id IN (SELECT id FROM doctors WHERE hospital_id = ?)", id);
            
            // 2. Cleanup staff roster
            jdbcTemplate.update("DELETE FROM doctors WHERE hospital_id = ?", id);
            jdbcTemplate.update("DELETE FROM hospital_admins WHERE hospital_id = ?", id);
            
            // 3. Purge Institutional entity
            jdbcTemplate.update("DELETE FROM hospitals WHERE id = ?", id);
            
            // 4. Purge User accounts for admins (since they are now orphans)
            if (!adminUserIds.isEmpty()) {
                for (Long userId : adminUserIds) {
                    jdbcTemplate.update("DELETE FROM users WHERE id = ?", userId);
                }
            }
            
            return ResponseEntity.ok(Map.of("message", "Institutional record and all associated administrative/staff data purged."));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "Hospital record not found.")));
    }
}
