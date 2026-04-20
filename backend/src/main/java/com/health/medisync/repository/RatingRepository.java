package com.health.medisync.repository;

import com.health.medisync.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByDoctorId(Long doctorId);
    Optional<Rating> findByAppointmentId(Long appointmentId);
}
