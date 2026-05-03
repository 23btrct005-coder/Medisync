package com.health.medisync.repository;

import com.health.medisync.model.Appointment;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.Appointment.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);
    List<Appointment> findByPatientId(Long patientId);
    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByDoctorIdAndStatus(Long doctorId, AppointmentStatus status);
    List<Appointment> findByDoctorIdAndStatusIn(Long doctorId, List<AppointmentStatus> statuses);
    List<Appointment> findByPatientIdAndStatusIn(Long patientId, List<AppointmentStatus> statuses);
    Optional<Appointment> findByRazorpayOrderId(String orderId);
    void deleteByDoctorId(Long doctorId);

    List<Appointment> findByAppointmentDate(LocalDate date);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND (a.status = 'BOOKED' OR a.status = 'COMPLETED')")
    List<Appointment> findRevenueAppointments(Long doctorId);

    @Query("SELECT a FROM Appointment a WHERE a.doctor = :doctor AND a.appointmentDate = :date AND a.timeSlot = :slot AND (a.status = 'BOOKED' OR (a.status = 'PENDING' AND a.createdAt > :expiry))")
    List<Appointment> findConflictingAppointments(Doctor doctor, LocalDate date, String slot, java.time.LocalDateTime expiry);
}
