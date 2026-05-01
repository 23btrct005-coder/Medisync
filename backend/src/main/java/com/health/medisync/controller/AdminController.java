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
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN')")
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
            String sql = "SELECT ha.id, ha.name as admin_name, ha.position, h.name as hospital_name, h.license_code, h.city, h.state, ha.approved " +
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
            // Only individual doctors (not affiliated with hospital) or all pending?
            // The user said "the institutional and only doctor should be get approved by the admin"
            // Institutional doctors are approved by Hospital Admin.
            // Individual doctors are approved by Global Admin.
            String sql = "SELECT id, name, email, phone, specialization, medical_degree, medical_license_number, hospital, years_of_experience, profile_picture_url, approved " +
                         "FROM doctors WHERE approved = false AND hospital_id IS NULL";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            
            List<DoctorDTO> dtos = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                DoctorDTO dto = new DoctorDTO();
                dto.setId(((Number) row.get("id")).longValue());
                dto.setName((String) row.get("name"));
                dto.setEmail((String) row.get("email"));
                dto.setPhone((String) row.get("phone"));
                dto.setSpecialization((String) row.get("specialization"));
                dto.setMedicalDegree((String) row.get("medical_degree"));
                dto.setMedicalLicenseNumber((String) row.get("medical_license_number"));
                dto.setHospital((String) row.get("hospital"));
                
                Object exp = row.get("years_of_experience");
                dto.setYearsOfExperience(exp != null ? ((Number) exp).intValue() : 0);
                
                dto.setProfilePictureUrl((String) row.get("profile_picture_url"));
                
                Object app = row.get("approved");
                dto.setApproved(app != null && (Boolean) app);
                
                dtos.add(dto);
            }
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            PinpointDiagnosticController.setLastError("ADMIN_500_ERROR: " + sw.toString());
            throw e;
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
            String sql = "SELECT ha.id, ha.name as admin_name, ha.position, h.name as hospital_name, h.license_code, h.city, h.state, ha.approved, u.enabled, u.id as user_id " +
                         "FROM hospital_admins ha " +
                         "JOIN hospitals h ON ha.hospital_id = h.id " +
                         "JOIN users u ON ha.user_id = u.id";
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
            String sql = "SELECT d.id, d.name, d.email, d.phone, d.specialization, d.medical_degree, d.medical_license_number, d.hospital, d.years_of_experience, d.profile_picture_url, d.approved, u.enabled, u.id as user_id " +
                         "FROM doctors d " +
                         "JOIN users u ON d.user_id = u.id";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(rows);
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
}
