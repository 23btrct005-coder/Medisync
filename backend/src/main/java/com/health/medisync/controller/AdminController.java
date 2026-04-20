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
    private final JdbcTemplate jdbcTemplate;

    public AdminController(DoctorRepository doctorRepository, UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/doctors/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPendingDoctors() {
        try {
            String sql = "SELECT id, name, email, phone, specialization, medical_degree, medical_license_number, hospital, years_of_experience, profile_picture_url, approved FROM doctors WHERE approved = false";
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
        }).orElse(ResponseEntity.notFound().build());
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
        }).orElse(ResponseEntity.notFound().build());
    }
}
