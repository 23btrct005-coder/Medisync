package com.health.medisync.repository;

import com.health.medisync.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByDoctorId(Long doctorId);
    Optional<Rating> findByAppointmentId(Long appointmentId);
    
    @Query("SELECT r.appointment.id FROM Rating r WHERE r.appointment.id IN :ids")
    List<Long> findRatedAppointmentIds(@Param("ids") List<Long> ids);
    
    @Query("SELECT r.doctor.id, AVG(r.stars), COUNT(r.id) FROM Rating r WHERE r.doctor.id IN :ids GROUP BY r.doctor.id")
    List<Object[]> getAggregatedRatings(@Param("ids") List<Long> ids);
    
    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.doctor.id = :doctorId")
    Double getAverageRatingByDoctorId(@Param("doctorId") Long doctorId);
    
    long countByDoctorId(Long doctorId);
}
