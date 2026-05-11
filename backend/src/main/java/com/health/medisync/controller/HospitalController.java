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
import com.health.medisync.repository.DoctorRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/hospital")
public class HospitalController {

    private final HospitalService hospitalService;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final HospitalAdminRepository hospitalAdminRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final com.health.medisync.service.AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;
    private final DoctorRepository doctorRepository;

    public HospitalController(HospitalService hospitalService,
                              UserRepository userRepository,
                              HospitalRepository hospitalRepository,
                              HospitalAdminRepository hospitalAdminRepository,
                              SupabaseStorageService supabaseStorageService,
                              com.health.medisync.service.AuditLogService auditLogService,
                              PasswordEncoder passwordEncoder,
                              DoctorRepository doctorRepository) {
        this.hospitalService = hospitalService;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
        this.supabaseStorageService = supabaseStorageService;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
        this.doctorRepository = doctorRepository;
    }

    private Integer safeInt(Object val) {
        if (val == null || val.toString().isEmpty()) return null;
        try { return Double.valueOf(val.toString()).intValue(); } catch (Exception e) { return null; }
    }

    private Double safeDouble(Object val) {
        if (val == null || val.toString().isEmpty()) return null;
        try { return Double.valueOf(val.toString()); } catch (Exception e) { return null; }
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
    public ResponseEntity<?> approveDoctor(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (id == null || id.equalsIgnoreCase("undefined")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid personnel identifier"));
            }
            Long doctorId = Long.valueOf(id.split("\\.")[0]);
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            HospitalAdmin admin = hospitalService.getAdminByUser(user);
            hospitalService.approveDoctor(doctorId, admin.getHospital());
            return ResponseEntity.ok(Map.of("message", "Physician approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> getAppointments(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(hospitalService.getHospitalAppointments(admin.getHospital()));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<com.health.medisync.model.PatientDTO>> getPatients(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        List<com.health.medisync.model.Patient> patients = hospitalService.getHospitalPatients(admin.getHospital());
        List<com.health.medisync.model.PatientDTO> dtos = patients.stream()
                .map(com.health.medisync.model.PatientDTO::new)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/staff-contacts")
    public ResponseEntity<?> getStaffContacts(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        List<Doctor> doctors = hospitalService.getHospitalDoctors(admin.getHospital());
        
        List<Map<String, Object>> contacts = doctors.stream()
                .map(d -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", d.getId());
                    m.put("userId", d.getUser().getId());
                    m.put("name", d.getName());
                    m.put("role", "DOCTOR");
                    m.put("profilePictureUrl", d.getProfilePictureUrl());
                    m.put("specialization", d.getSpecialization());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(contacts);
    }

    @GetMapping("/profile")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        Hospital hospital = admin.getHospital();

        Map<String, Object> response = new HashMap<>();
        response.put("id", admin.getId());
        response.put("name", admin.getName());
        response.put("position", admin.getPosition());
        response.put("contactNumber", admin.getContactNumber());
        response.put("profilePictureUrl", admin.getProfilePictureUrl());
        response.put("idProofUrl", admin.getIdProofUrl());
        response.put("approved", admin.isApproved());
        
        if (hospital != null) {
            Map<String, Object> hMap = new HashMap<>();
            hMap.put("id", hospital.getId());
            hMap.put("name", hospital.getName());
            hMap.put("licenseCode", hospital.getLicenseCode());
            hMap.put("hospitalType", hospital.getHospitalType());
            hMap.put("ownershipType", hospital.getOwnershipType());
            hMap.put("website", hospital.getWebsite());
            hMap.put("phone", hospital.getPhone());
            hMap.put("contactEmail", hospital.getContactEmail());
            hMap.put("state", hospital.getState());
            hMap.put("city", hospital.getCity());
            hMap.put("pinCode", hospital.getPinCode());
            hMap.put("street", hospital.getStreet());
            hMap.put("logoUrl", hospital.getLogoUrl());
            hMap.put("gstNumber", hospital.getGstNumber());
            hMap.put("panNumber", hospital.getPanNumber());
            hMap.put("nabhId", hospital.getNabhId());
            hMap.put("isoId", hospital.getIsoId());
            hMap.put("facilityId", hospital.getFacilityId());
            hMap.put("govtRegistrationNumber", hospital.getGovtRegistrationNumber());
            hMap.put("cinNumber", hospital.getCinNumber());
            hMap.put("totalBeds", hospital.getTotalBeds());
            hMap.put("doctorCount", hospital.getDoctorCount());
            hMap.put("nurseCount", hospital.getNurseCount());
            hMap.put("generalStaffCount", hospital.getGeneralStaffCount());
            hMap.put("icuAvailable", hospital.getIcuAvailable());
            hMap.put("icuBeds", hospital.getIcuBeds());
            hMap.put("operationTheatersCount", hospital.getOperationTheatersCount());
            hMap.put("ambulanceAvailable", hospital.getAmbulanceAvailable());
            hMap.put("ambulanceCount", hospital.getAmbulanceCount());
            hMap.put("emergencyServicesAvailable", hospital.getEmergencyServicesAvailable());
            hMap.put("officialEmergencyContact", hospital.getOfficialEmergencyContact());
            hMap.put("alternatePhone", hospital.getAlternatePhone());
            hMap.put("insuranceProviders", hospital.getInsuranceProviders());
            hMap.put("googleMapsUrl", hospital.getGoogleMapsUrl());
            hMap.put("medicalDirectorName", hospital.getMedicalDirectorName());
            hMap.put("medicalDirectorEmail", hospital.getMedicalDirectorEmail());
            hMap.put("serviceFees", hospital.getServiceFees());
            hMap.put("serviceDurations", hospital.getServiceDurations());
            hMap.put("services", hospital.getServices());
            hMap.put("departments", hospital.getDepartments());
            hMap.put("bloodStock", hospital.getBloodStock());
            
            hMap.put("razorpayAccountId", hospital.getRazorpayAccountId());
            hMap.put("razorpayKeyId", hospital.getRazorpayKeyId());
            hMap.put("razorpayKeySecret", hospital.getRazorpayKeySecret());
            hMap.put("preferredPaymentMode", hospital.getPreferredPaymentMode());
            hMap.put("upiId", hospital.getUpiId());
            hMap.put("bankName", hospital.getBankName());
            hMap.put("bankAccountNumber", hospital.getBankAccountNumber());
            hMap.put("ifscCode", hospital.getIfscCode());
            
            response.put("hospital", hMap);
        }

        response.put("email", user.getUsername());
        response.put("emailVerified", user.isEmailVerified());
        
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("email", user.getUsername());
        userMap.put("emailVerified", user.isEmailVerified());
        response.put("user", userMap);

        return ResponseEntity.ok(response);
    }

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
            if (data.get("alternatePhone") != null) hospital.setAlternatePhone(String.valueOf(data.get("alternatePhone")));
            if (data.get("emergencyPhone") != null) hospital.setOfficialEmergencyContact(String.valueOf(data.get("emergencyPhone")));

            if (data.containsKey("gstNumber")) hospital.setGstNumber(String.valueOf(data.get("gstNumber")));
            if (data.containsKey("panNumber")) hospital.setPanNumber(String.valueOf(data.get("panNumber")));
            if (data.containsKey("nabhId"))    hospital.setNabhId(String.valueOf(data.get("nabhId")));
            if (data.containsKey("isoId"))     hospital.setIsoId(String.valueOf(data.get("isoId")));
            
            if (data.containsKey("totalBeds")) hospital.setTotalBeds(safeInt(data.get("totalBeds")));
            if (data.containsKey("icuBeds")) hospital.setIcuBeds(safeInt(data.get("icuBeds")));
            if (data.containsKey("operationTheatersCount")) hospital.setOperationTheatersCount(safeInt(data.get("operationTheatersCount")));
            if (data.containsKey("ambulanceCount")) hospital.setAmbulanceCount(safeInt(data.get("ambulanceCount")));
            if (data.containsKey("nurseCount")) hospital.setNurseCount(safeInt(data.get("nurseCount")));
            if (data.containsKey("generalStaffCount")) hospital.setGeneralStaffCount(safeInt(data.get("generalStaffCount")));
            
            if (data.get("emergencyServicesAvailable") != null) 
                hospital.setEmergencyServicesAvailable(Boolean.parseBoolean(data.get("emergencyServicesAvailable").toString()));

            if (data.get("insuranceProviders") != null) hospital.setInsuranceProviders(String.valueOf(data.get("insuranceProviders")));
            if (data.get("services") != null) hospital.setServices(String.valueOf(data.get("services")));
            if (data.get("departments") != null) hospital.setDepartments(String.valueOf(data.get("departments")));
            if (data.get("billingContactEmail") != null) hospital.setBillingContactEmail(String.valueOf(data.get("billingContactEmail")));
            if (data.get("billingContactPhone") != null) hospital.setBillingContactPhone(String.valueOf(data.get("billingContactPhone")));
            if (data.get("serviceFees") != null) hospital.setServiceFees(mapper.writeValueAsString(data.get("serviceFees")));
            if (data.get("serviceDurations") != null) hospital.setServiceDurations(mapper.writeValueAsString(data.get("serviceDurations")));
            if (data.get("serviceCapacity") != null) hospital.setServiceCapacity(mapper.writeValueAsString(data.get("serviceCapacity")));
            if (data.get("consultationTimings") != null) hospital.setConsultationTimings(String.valueOf(data.get("consultationTimings")));
            if (data.get("bloodStock") != null) hospital.setBloodStock(mapper.writeValueAsString(data.get("bloodStock")));

            if (data.get("googleMapsUrl") != null) hospital.setGoogleMapsUrl(String.valueOf(data.get("googleMapsUrl")));
            if (data.get("facebookUrl")   != null) hospital.setFacebookUrl(String.valueOf(data.get("facebookUrl")));
            if (data.get("twitterUrl")    != null) hospital.setTwitterUrl(String.valueOf(data.get("twitterUrl")));
            if (data.get("instagramUrl")  != null) hospital.setInstagramUrl(String.valueOf(data.get("instagramUrl")));

            if (data.get("razorpayAccountId") != null) hospital.setRazorpayAccountId(String.valueOf(data.get("razorpayAccountId")));
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
            if (data.get("adminPhone") != null) admin.setContactNumber(String.valueOf(data.get("adminPhone")));

            hospitalRepository.save(hospital);
            hospitalAdminRepository.save(admin);
            hospitalService.syncHospitalCoordinates(hospital);

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
        
        if (request.get("patientId") == null || request.get("doctorId") == null || 
            request.get("date") == null || request.get("slot") == null || request.get("type") == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required appointment parameters"));
        }

        Long patientId = Long.valueOf(request.get("patientId").toString());
        Long doctorId  = Long.valueOf(request.get("doctorId").toString());
        java.time.LocalDate date = java.time.LocalDate.parse(request.get("date").toString());
        String slot = request.get("slot").toString();
        String type = request.get("type").toString();
        
        hospitalService.bookAppointment(patientId, doctorId, date, slot, type, admin.getHospital());
        return ResponseEntity.ok(Map.of("message", "Appointment synchronized successfully"));
    }

    @PostMapping("/update-doctor/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable String id,
                                          @RequestBody Map<String, Object> payload,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (id == null || id.equalsIgnoreCase("undefined")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid personnel identifier"));
            }
            Long doctorId = Long.valueOf(id.split("\\.")[0]);
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            HospitalAdmin admin = hospitalService.getAdminByUser(user);
            hospitalService.updateDoctorProfile(doctorId, payload, admin.getHospital());
            return ResponseEntity.ok(Map.of("message", "Doctor profile updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/doctor/{id}")
    public ResponseEntity<?> getDoctor(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (id == null || id.equalsIgnoreCase("undefined")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid personnel identifier"));
            }
            Long doctorId = Long.valueOf(id.split("\\.")[0]);
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            HospitalAdmin admin = hospitalService.getAdminByUser(user);
            Doctor doctor = hospitalService.getDoctorById(doctorId, admin.getHospital());
            return ResponseEntity.ok(new com.health.medisync.model.DoctorDTO(doctor));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/delete-doctor/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (id == null || id.equalsIgnoreCase("undefined")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid personnel identifier"));
            }
            Long doctorId = Long.valueOf(id.split("\\.")[0]);
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            HospitalAdmin admin = hospitalService.getAdminByUser(user);
            hospitalService.deleteDoctor(doctorId, admin.getHospital());
            return ResponseEntity.ok(Map.of("message", "Physician record purged successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping(value = "/onboard-doctor", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> onboardDoctor(
            @RequestPart("doctor") String doctorJson,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @RequestPart(value = "licenseFile", required = false) MultipartFile licenseFile,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            HospitalAdmin admin = hospitalService.getAdminByUser(user);
            Hospital hospital = admin.getHospital();

            ObjectMapper mapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> data = mapper.readValue(doctorJson, Map.class);

            String email = String.valueOf(data.get("email")).toLowerCase();
            if (userRepository.findByUsernameIgnoreCase(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "A user account with this email already exists."));
            }
            if (doctorRepository.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "A physician profile with this email already exists."));
            }

            User newUser = new User();
            newUser.setUsername(email);
            newUser.setRole("ROLE_DOCTOR");
            newUser.setEnabled(true);
            newUser.setEmailVerified(true);
            newUser.setPassword(passwordEncoder.encode("MediSync@2026"));
            newUser = userRepository.save(newUser);

            Doctor doctor = new Doctor();
            doctor.setUser(newUser);
            doctor.setHospitalEntity(hospital);
            doctor.setHospital(hospital.getName());
            doctor.setInstitutional(true);
            doctor.setApproved(true);
            doctor.setName(String.valueOf(data.get("name")));
            doctor.setEmail(email);
            doctor.setPhone(String.valueOf(data.get("phone")));
            doctor.setGender(String.valueOf(data.get("gender")));
            doctor.setDateOfBirth(String.valueOf(data.get("dateOfBirth")));
            doctor.setAge(safeInt(data.get("age")));
            doctor.setSpecialization(String.valueOf(data.get("specialization")));
            doctor.setMedicalDegree(String.valueOf(data.get("medicalDegree")));
            doctor.setMedicalLicenseNumber(String.valueOf(data.get("medicalLicenseNumber")));
            doctor.setMedicalCouncil(String.valueOf(data.get("medicalCouncil")));
            doctor.setLicenseExpiryDate(String.valueOf(data.get("licenseExpiryDate")));
            doctor.setCollege(String.valueOf(data.get("college")));
            doctor.setYearsOfExperience(safeInt(data.get("yearsOfExperience")));
            doctor.setEmployeeId(String.valueOf(data.get("employeeId")));
            doctor.setOpdRoomNumber(String.valueOf(data.get("opdRoomNumber")));
            doctor.setContractType(String.valueOf(data.get("contractType")));
            doctor.setWorkingDays(String.valueOf(data.get("workingDays")));
            doctor.setConsultationTimings(String.valueOf(data.get("consultationTimings")));
            doctor.setBreakTimings(String.valueOf(data.get("breakTimings")));
            doctor.setSlotDuration(safeInt(data.get("slotDuration")));
            doctor.setMaxPatientsPerDay(safeInt(data.get("maxPatientsPerDay")));
            doctor.setOnlineConsultationFee(safeDouble(data.get("onlineConsultationFee")));
            doctor.setOfflineConsultationFee(safeDouble(data.get("offlineConsultationFee")));
            doctor.setSubSpecialties(String.valueOf(data.get("subSpecialties")));
            doctor.setLanguagesSpoken(String.valueOf(data.get("languagesSpoken")));
            doctor.setTreatmentFocus(String.valueOf(data.get("treatmentFocus")));
            doctor.setProceduresHandled(String.valueOf(data.get("proceduresHandled")));
            doctor.setPublications(String.valueOf(data.get("publications")));
            doctor.setServices(String.valueOf(data.get("services")));

            if (data.containsKey("canPrescribe")) doctor.setCanPrescribe(Boolean.parseBoolean(data.get("canPrescribe").toString()));
            if (data.containsKey("canEditPatientData")) doctor.setCanEditPatientData(Boolean.parseBoolean(data.get("canEditPatientData").toString()));
            if (data.containsKey("canAccessReports")) doctor.setCanAccessReports(Boolean.parseBoolean(data.get("canAccessReports").toString()));
            if (data.containsKey("canManageAppointments")) doctor.setCanManageAppointments(Boolean.parseBoolean(data.get("canManageAppointments").toString()));

            if (profilePicture != null && !profilePicture.isEmpty()) {
                doctor.setProfilePictureUrl(supabaseStorageService.uploadFile(profilePicture));
            }
            if (licenseFile != null && !licenseFile.isEmpty()) {
                doctor.setLicenseDocumentUrl(supabaseStorageService.uploadFile(licenseFile));
            }

            doctorRepository.save(doctor);
            auditLogService.log(user.getId(), admin.getName(), "PERSONNEL_ONBOARDING", null, hospital.getId(), "Onboarded: " + doctor.getName());

            return ResponseEntity.ok(Map.of("message", "Physician onboarded successfully."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Institutional onboarding failed: " + e.getMessage()));
        }
    }

    @PostMapping("/broadcast")
    public ResponseEntity<?> broadcastMessage(@RequestBody Map<String, String> request,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        
        String title = request.getOrDefault("title", "Institutional Announcement");
        String message = request.get("message");
        
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Broadcast message cannot be empty"));
        }
        
        hospitalService.broadcastToStaff(admin.getHospital(), title, message, user.getId());
        return ResponseEntity.ok(Map.of("message", "Institutional broadcast dispatched successfully"));
    }
}
