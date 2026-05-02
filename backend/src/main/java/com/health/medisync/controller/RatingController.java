package com.health.medisync.controller;

import com.health.medisync.model.Rating;
import com.health.medisync.repository.RatingRepository;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.model.Appointment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    private final RatingRepository ratingRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    public RatingController(RatingRepository ratingRepository, 
                            AppointmentRepository appointmentRepository,
                            DoctorRepository doctorRepository,
                            PatientRepository patientRepository) {
        this.ratingRepository = ratingRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
    }

    @PostMapping
    public ResponseEntity<?> submitRating(Authentication authentication, @RequestBody Map<String, Object> request) {
        try {
            if (request.get("appointmentId") == null || request.get("stars") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing required rating parameters"));
            }
            Long appointmentId = Long.valueOf(request.get("appointmentId").toString());
            Integer stars = Integer.valueOf(request.get("stars").toString());
            String comment = (String) request.get("comment");

            Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Clinical session not found."));

            // Verification: Only the assigned patient can rate
            if (!appointment.getPatient().getUser().getUsername().equalsIgnoreCase(authentication.getName())) {
                return ResponseEntity.status(403).body(Map.of("message", "Unauthorized feedback attempt."));
            }

            // Verification: One rating per appointment
            if (ratingRepository.findByAppointmentId(appointmentId).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Feedback already submitted for this session."));
            }

            Rating rating = new Rating();
            rating.setAppointment(appointment);
            rating.setDoctor(appointment.getDoctor());
            rating.setPatient(appointment.getPatient());
            rating.setStars(stars);
            rating.setComment(comment);

            ratingRepository.save(rating);
            return ResponseEntity.ok(Map.of("message", "Thank you for your feedback!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Rating>> getDoctorRatings(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ratingRepository.findByDoctorId(doctorId));
    }
}
