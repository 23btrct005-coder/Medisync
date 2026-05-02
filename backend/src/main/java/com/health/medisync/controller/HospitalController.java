package com.health.medisync.controller;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Hospital;
import com.health.medisync.model.HospitalAdmin;
import com.health.medisync.model.User;
import com.health.medisync.service.HospitalService;
import com.health.medisync.service.SupabaseStorageService;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.HospitalRepository;
import com.health.medisync.repository.HospitalAdminRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospital")
public class HospitalController {

    private final HospitalService hospitalService;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final HospitalAdminRepository hospitalAdminRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final com.health.medisync.service.AuditLogService auditLogService;

    public HospitalController(HospitalService hospitalService,
                              UserRepository userRepository,
                              HospitalRepository hospitalRepository,
                              HospitalAdminRepository hospitalAdminRepository,
                              SupabaseStorageService supabaseStorageService,
                              com.health.medisync.service.AuditLogService auditLogService) {
        this.hospitalService = hospitalService;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
        this.supabaseStorageService = supabaseStorageService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(auditLogService.getHospitalAuditLogs(admin.getHospital().getId()));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(hospitalService.getHospitalStats(admin.getHospital()));
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<com.health.medisync.model.DoctorDTO>> getDoctors(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        List<Doctor> doctors = hospitalService.getHospitalDoctors(admin.getHospital());
        List<com.health.medisync.model.DoctorDTO> dtos = doctors.stream()
                .map(com.health.medisync.model.DoctorDTO::new)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/approve-doctor/{id}")
    public ResponseEntity<?> approveDoctor(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        hospitalService.approveDoctor(id, admin.getHospital());
        return ResponseEntity.ok(Map.of("message", "Physician approved successfully"));
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> getAppointments(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(hospitalService.getHospitalAppointments(admin.getHospital()));
    }

    @GetMapping("/patients")
    public ResponseEntity<?> getPatients(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(hospitalService.getHospitalPatients(admin.getHospital()));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(admin);
    }

    /** Update hospital profile & admin identity from the dashboard */
    @PostMapping(value = "/update-profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProfile(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            HospitalAdmin admin = hospitalService.getAdminByUser(user);
            Hospital hospital = admin.getHospital();

            ObjectMapper mapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> data = mapper.readValue(dataJson, Map.class);

            if (data.get("hospitalName") != null)  hospital.setName(String.valueOf(data.get("hospitalName")));
            if (data.get("hospitalType") != null)  hospital.setHospitalType(String.valueOf(data.get("hospitalType")));
            if (data.get("licenseCode")  != null)  hospital.setLicenseCode(String.valueOf(data.get("licenseCode")));
            if (data.get("website")      != null)  hospital.setWebsite(String.valueOf(data.get("website")));
            if (data.get("phone")        != null)  hospital.setPhone(String.valueOf(data.get("phone")));
            if (data.get("contactEmail") != null)  hospital.setContactEmail(String.valueOf(data.get("contactEmail")));
            if (data.get("state")        != null)  hospital.setState(String.valueOf(data.get("state")));
            if (data.get("city")         != null)  hospital.setCity(String.valueOf(data.get("city")));
            if (data.get("pinCode")      != null)  hospital.setPinCode(String.valueOf(data.get("pinCode")));
            if (data.get("street")       != null)  hospital.setStreet(String.valueOf(data.get("street")));

            // New Legal & Infrastructure Fields
            if (data.get("gstNumber") != null) hospital.setGstNumber(String.valueOf(data.get("gstNumber")));
            if (data.get("panNumber") != null) hospital.setPanNumber(String.valueOf(data.get("panNumber")));
            if (data.get("nabhId")    != null) hospital.setNabhId(String.valueOf(data.get("nabhId")));
            if (data.get("isoId")     != null) hospital.setIsoId(String.valueOf(data.get("isoId")));
            
            if (data.get("totalBeds") != null && !data.get("totalBeds").toString().isEmpty()) 
                hospital.setTotalBeds(Integer.parseInt(data.get("totalBeds").toString()));
            if (data.get("icuBeds") != null && !data.get("icuBeds").toString().isEmpty()) 
                hospital.setIcuBeds(Integer.parseInt(data.get("icuBeds").toString()));
            if (data.get("operationTheatersCount") != null && !data.get("operationTheatersCount").toString().isEmpty()) 
                hospital.setOperationTheatersCount(Integer.parseInt(data.get("operationTheatersCount").toString()));
            if (data.get("ambulanceCount") != null && !data.get("ambulanceCount").toString().isEmpty()) 
                hospital.setAmbulanceCount(Integer.parseInt(data.get("ambulanceCount").toString()));
            if (data.get("nurseCount") != null && !data.get("nurseCount").toString().isEmpty()) 
                hospital.setNurseCount(Integer.parseInt(data.get("nurseCount").toString()));
            if (data.get("generalStaffCount") != null && !data.get("generalStaffCount").toString().isEmpty()) 
                hospital.setGeneralStaffCount(Integer.parseInt(data.get("generalStaffCount").toString()));
            if (data.get("emergencyServicesAvailable") != null) 
                hospital.setEmergencyServicesAvailable(Boolean.parseBoolean(data.get("emergencyServicesAvailable").toString()));

            if (data.get("insuranceProviders") != null) hospital.setInsuranceProviders(String.valueOf(data.get("insuranceProviders")));
            if (data.get("billingContactEmail") != null) hospital.setBillingContactEmail(String.valueOf(data.get("billingContactEmail")));
            if (data.get("billingContactPhone") != null) hospital.setBillingContactPhone(String.valueOf(data.get("billingContactPhone")));

            if (data.get("googleMapsUrl") != null) hospital.setGoogleMapsUrl(String.valueOf(data.get("googleMapsUrl")));
            if (data.get("facebookUrl")   != null) hospital.setFacebookUrl(String.valueOf(data.get("facebookUrl")));
            if (data.get("twitterUrl")    != null) hospital.setTwitterUrl(String.valueOf(data.get("twitterUrl")));
            if (data.get("instagramUrl")  != null) hospital.setInstagramUrl(String.valueOf(data.get("instagramUrl")));

            // Financial Settlements
            if (data.get("razorpayKeyId") != null)     hospital.setRazorpayKeyId(String.valueOf(data.get("razorpayKeyId")));
            if (data.get("razorpayKeySecret") != null) hospital.setRazorpayKeySecret(String.valueOf(data.get("razorpayKeySecret")));
            if (data.get("upiId") != null)             hospital.setUpiId(String.valueOf(data.get("upiId")));
            if (data.get("preferredPaymentMode") != null) hospital.setPreferredPaymentMode(String.valueOf(data.get("preferredPaymentMode")));

            String city  = hospital.getCity()  != null ? hospital.getCity()  : "";
            String state = hospital.getState() != null ? hospital.getState() : "";
            hospital.setLocation((city + ", " + state).trim().replaceAll("^,\\s*|,\\s*$", "").trim());

            if (logo != null && !logo.isEmpty()) {
                String logoUrl = supabaseStorageService.uploadFile(logo);
                if (logoUrl != null) hospital.setLogoUrl(logoUrl);
            }

            if (data.get("adminName") != null) admin.setName(String.valueOf(data.get("adminName")));
            if (data.get("position")  != null) admin.setPosition(String.valueOf(data.get("position")));

            hospitalRepository.save(hospital);
            hospitalAdminRepository.save(admin);

            // Log administrative update
            auditLogService.log(user.getId(), admin.getName(), "INSTITUTIONAL_PROFILE_UPDATE", null, hospital.getId(), 
                               "Admin updated institutional profile for: " + hospital.getName());

            return ResponseEntity.ok(Map.of("message", "Institutional profile updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Update failed: " + e.getMessage()));
        }
    }

    @PostMapping("/book-appointment")
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> request,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        Long patientId = Long.valueOf(request.get("patientId").toString());
        Long doctorId  = Long.valueOf(request.get("doctorId").toString());
        java.time.LocalDate date = java.time.LocalDate.parse(request.get("date").toString());
        String slot = request.get("slot").toString();
        String type = request.get("type").toString();
        hospitalService.bookAppointment(patientId, doctorId, date, slot, type, admin.getHospital());
        return ResponseEntity.ok(Map.of("message", "Appointment synchronized successfully"));
    }

    @PostMapping("/update-doctor/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id,
                                          @RequestBody Map<String, Object> updates,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        hospitalService.updateDoctorProfile(id, updates, admin.getHospital());
        return ResponseEntity.ok(Map.of("message", "Physician profile updated successfully"));
    }
}
