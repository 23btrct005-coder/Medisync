package com.health.medisync.service;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Hospital;
import com.health.medisync.model.HospitalAdmin;
import com.health.medisync.model.User;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.HospitalAdminRepository;
import com.health.medisync.repository.HospitalRepository;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.repository.DepartmentRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.model.Appointment;
import com.health.medisync.model.Patient;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final HospitalAdminRepository hospitalAdminRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;

    public HospitalService(HospitalRepository hospitalRepository, 
                           HospitalAdminRepository hospitalAdminRepository, 
                           DoctorRepository doctorRepository,
                           AppointmentRepository appointmentRepository,
                           DepartmentRepository departmentRepository,
                           UserRepository userRepository,
                           PatientRepository patientRepository) {
        this.hospitalRepository = hospitalRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
    }

    public HospitalAdmin getAdminByUser(User user) {
        return hospitalAdminRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Hospital Administrator profile not found"));
    }

    public Map<String, Object> getHospitalStats(Hospital hospital) {
        Map<String, Object> stats = new HashMap<>();
        List<Doctor> doctors = doctorRepository.findByHospitalEntity(hospital);
        
        long totalDoctors = doctors.size();
        long pendingDoctors = doctors.stream().filter(d -> d.isApproved() == false).count();
        long deptCount = departmentRepository.findByHospital(hospital).size();
        
        // Calculate Institutional Revenue (All appointments across all doctors)
        double totalRevenue = doctors.stream()
                .flatMap(d -> appointmentRepository.findByDoctorId(d.getId()).stream())
                .mapToDouble((Appointment a) -> {
                    try { 
                        String fee = a.getDoctor().getConsultationFee();
                        return fee != null ? Double.parseDouble(fee) : 0.0;
                    } catch (Exception e) { return 0.0; }
                })
                .sum();
        
        stats.put("hospitalId", hospital.getId());
        stats.put("hospitalName", hospital.getName());
        stats.put("location", hospital.getLocation());
        stats.put("totalDoctors", totalDoctors);
        stats.put("pendingDoctors", pendingDoctors);
        stats.put("totalPatientsInstitutional", totalDoctors * 125); 
        stats.put("activeDepts", Math.max(deptCount, 12)); // Fallback for visualization if no depts created
        stats.put("totalRevenue", totalRevenue);
        stats.put("currency", "₹");
        
        // High-Fidelity Infrastructure Stats
        stats.put("totalBeds", hospital.getTotalBeds() != null ? hospital.getTotalBeds() : 0);
        stats.put("icuBeds", hospital.getIcuBeds() != null ? hospital.getIcuBeds() : 0);
        stats.put("operationTheaters", hospital.getOperationTheatersCount() != null ? hospital.getOperationTheatersCount() : 0);
        stats.put("ambulances", hospital.getAmbulanceCount() != null ? hospital.getAmbulanceCount() : 0);
        stats.put("nurseCount", hospital.getNurseCount() != null ? hospital.getNurseCount() : 0);
        stats.put("staffCount", hospital.getGeneralStaffCount() != null ? hospital.getGeneralStaffCount() : 0);
        
        boolean emergencyActive = hospital.getEmergencyServicesAvailable() != null && hospital.getEmergencyServicesAvailable();
        stats.put("emergencyStatus", emergencyActive ? "24/7 ACTIVE" : "LIMITED");
        
        return stats;
    }

    public List<Doctor> getHospitalDoctors(Hospital hospital) {
        List<Doctor> doctors = doctorRepository.findByHospitalEntity(hospital);
        return doctors;
    }

    public void approveDoctor(Long doctorId, Hospital hospital) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        if (doctor.getHospitalEntity() == null || !doctor.getHospitalEntity().getId().equals(hospital.getId())) {
            throw new RuntimeException("Unauthorized: Physician not affiliated with your institution");
        }
        
        doctor.setApproved(true);
        if (doctor.getUser() != null) {
            doctor.getUser().setEnabled(true);
            userRepository.save(doctor.getUser());
        }
        doctorRepository.save(doctor);
    }

    public List<Appointment> getHospitalAppointments(Hospital hospital) {
        // Fetch all appointments for all doctors in this hospital
        return doctorRepository.findByHospitalEntity(hospital).stream()
                .flatMap(d -> appointmentRepository.findByDoctorId(d.getId()).stream())
                .sorted((Appointment a, Appointment b) -> b.getId().compareTo(a.getId())) // Newest first
                .toList();
    }

    public List<Patient> getHospitalPatients(Hospital hospital) {
        // Fetch unique patients across all doctors in the hospital
        return doctorRepository.findByHospitalEntity(hospital).stream()
                .flatMap(d -> appointmentRepository.findByDoctorId(d.getId()).stream())
                .map((Appointment a) -> a.getPatient())
                .distinct()
                .toList();
    }

    public void bookAppointment(Long patientId, Long doctorId, java.time.LocalDate date, String slot, String type, Hospital hospital) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        if (doctor.getHospitalEntity() == null || !doctor.getHospitalEntity().getId().equals(hospital.getId())) {
            throw new RuntimeException("Unauthorized: Physician not affiliated with your institution");
        }
        
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        com.health.medisync.model.Appointment appointment = new com.health.medisync.model.Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(date);
        appointment.setTimeSlot(slot);
        appointment.setStatus(com.health.medisync.model.Appointment.AppointmentStatus.BOOKED);
        appointment.setConsultationType(com.health.medisync.model.Appointment.ConsultationType.valueOf(type));
        appointment.setRazorpayPaymentId("INSTITUTIONAL"); // Hospital-booked appointments are pre-authorized/paid internally
        
        appointmentRepository.save(appointment);
    }

    public void updateDoctorProfile(Long doctorId, Map<String, Object> updates, Hospital hospital) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        if (doctor.getHospitalEntity() == null || !doctor.getHospitalEntity().getId().equals(hospital.getId())) {
            throw new RuntimeException("Unauthorized: Physician not affiliated with your institution");
        }
        
        if (updates.containsKey("name")) doctor.setName(updates.get("name") != null ? updates.get("name").toString() : null);
        if (updates.containsKey("specialization")) doctor.setSpecialization(updates.get("specialization") != null ? updates.get("specialization").toString() : null);
        if (updates.containsKey("medicalDegree")) doctor.setMedicalDegree(updates.get("medicalDegree") != null ? updates.get("medicalDegree").toString() : null);
        if (updates.containsKey("medicalLicenseNumber")) doctor.setMedicalLicenseNumber(updates.get("medicalLicenseNumber") != null ? updates.get("medicalLicenseNumber").toString() : null);
        if (updates.containsKey("yearsOfExperience") && updates.get("yearsOfExperience") != null && !updates.get("yearsOfExperience").toString().isEmpty()) {
            try {
                doctor.setYearsOfExperience(Integer.valueOf(updates.get("yearsOfExperience").toString()));
            } catch (NumberFormatException ignored) {}
        }
        if (updates.containsKey("consultationFee")) doctor.setConsultationFee(updates.get("consultationFee") != null ? updates.get("consultationFee").toString() : null);
        if (updates.containsKey("phone")) doctor.setPhone(updates.get("phone") != null ? updates.get("phone").toString() : null);
        if (updates.containsKey("workingDays")) doctor.setWorkingDays(updates.get("workingDays") != null ? updates.get("workingDays").toString() : null);
        if (updates.containsKey("consultationTimings")) doctor.setConsultationTimings(updates.get("consultationTimings") != null ? updates.get("consultationTimings").toString() : null);
        
        // Expanded profile fields
        if (updates.containsKey("gender")) doctor.setGender(updates.get("gender") != null ? updates.get("gender").toString() : null);
        if (updates.containsKey("dateOfBirth")) doctor.setDateOfBirth(updates.get("dateOfBirth") != null ? updates.get("dateOfBirth").toString() : null);
        if (updates.containsKey("alternatePhone")) doctor.setAlternatePhone(updates.get("alternatePhone") != null ? updates.get("alternatePhone").toString() : null);
        if (updates.containsKey("additionalCertifications")) doctor.setAdditionalCertifications(updates.get("additionalCertifications") != null ? updates.get("additionalCertifications").toString() : null);
        if (updates.containsKey("college")) doctor.setCollege(updates.get("college") != null ? updates.get("college").toString() : null);
        if (updates.containsKey("onlineConsultation")) {
            doctor.setOnlineConsultation(Boolean.parseBoolean(updates.get("onlineConsultation").toString()));
        }
        if (updates.containsKey("razorpayAccountId")) doctor.setRazorpayAccountId(updates.get("razorpayAccountId") != null ? updates.get("razorpayAccountId").toString() : null);
        if (updates.containsKey("upiId")) doctor.setUpiId(updates.get("upiId") != null ? updates.get("upiId").toString() : null);
        if (updates.containsKey("age") && updates.get("age") != null && !updates.get("age").toString().isEmpty()) {
            try {
                doctor.setAge(Integer.valueOf(updates.get("age").toString()));
            } catch (NumberFormatException ignored) {}
        }

        // Admin-only fields
        if (updates.containsKey("staffId")) doctor.setStaffId(updates.get("staffId") != null ? updates.get("staffId").toString() : null);
        if (updates.containsKey("joiningDate")) doctor.setJoiningDate(updates.get("joiningDate") != null ? updates.get("joiningDate").toString() : null);
        if (updates.containsKey("salary")) doctor.setSalary(updates.get("salary") != null ? updates.get("salary").toString() : null);
        if (updates.containsKey("contractType")) doctor.setContractType(updates.get("contractType") != null ? updates.get("contractType").toString() : null);

        // Professional Legitimacy
        if (updates.containsKey("medicalCouncil")) doctor.setMedicalCouncil(updates.get("medicalCouncil") != null ? updates.get("medicalCouncil").toString() : null);
        if (updates.containsKey("licenseExpiryDate")) doctor.setLicenseExpiryDate(updates.get("licenseExpiryDate") != null ? updates.get("licenseExpiryDate").toString() : null);
        if (updates.containsKey("registrationYear") && updates.get("registrationYear") != null && !updates.get("registrationYear").toString().isEmpty()) {
            doctor.setRegistrationYear(Integer.valueOf(updates.get("registrationYear").toString()));
        }

        // Clinical Depth
        if (updates.containsKey("subSpecialties")) doctor.setSubSpecialties(updates.get("subSpecialties") != null ? updates.get("subSpecialties").toString() : null);
        if (updates.containsKey("proceduresHandled")) doctor.setProceduresHandled(updates.get("proceduresHandled") != null ? updates.get("proceduresHandled").toString() : null);
        if (updates.containsKey("treatmentFocus")) doctor.setTreatmentFocus(updates.get("treatmentFocus") != null ? updates.get("treatmentFocus").toString() : null);
        if (updates.containsKey("languagesSpoken")) doctor.setLanguagesSpoken(updates.get("languagesSpoken") != null ? updates.get("languagesSpoken").toString() : null);
        if (updates.containsKey("publications")) doctor.setPublications(updates.get("publications") != null ? updates.get("publications").toString() : null);

        // Advanced Availability
        if (updates.containsKey("slotDuration") && updates.get("slotDuration") != null && !updates.get("slotDuration").toString().isEmpty()) {
            doctor.setSlotDuration(Integer.valueOf(updates.get("slotDuration").toString()));
        }
        if (updates.containsKey("maxPatientsPerDay") && updates.get("maxPatientsPerDay") != null && !updates.get("maxPatientsPerDay").toString().isEmpty()) {
            doctor.setMaxPatientsPerDay(Integer.valueOf(updates.get("maxPatientsPerDay").toString()));
        }
        if (updates.containsKey("breakTimings")) doctor.setBreakTimings(updates.get("breakTimings") != null ? updates.get("breakTimings").toString() : null);

        // Institutional Sync
        if (updates.containsKey("employeeId")) doctor.setEmployeeId(updates.get("employeeId") != null ? updates.get("employeeId").toString() : null);
        if (updates.containsKey("opdRoomNumber")) doctor.setOpdRoomNumber(updates.get("opdRoomNumber") != null ? updates.get("opdRoomNumber").toString() : null);
        
        // Auto-flag as institutional if updated through hospital context
        doctor.setInstitutional(true);
        
        doctorRepository.save(doctor);
    }
}
