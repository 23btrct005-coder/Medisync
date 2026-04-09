package com.health.medisync;

import com.health.medisync.model.*;
import com.health.medisync.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final MedicalRecordRepository recordRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PatientRepository patientRepository,
                      MedicalRecordRepository recordRepository, DoctorRepository doctorRepository, 
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.recordRepository = recordRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByUsername("patient1").isEmpty()) {
            // Seed Patient User
            User user = new User();
            user.setUsername("patient1");
            user.setPassword(passwordEncoder.encode("password123"));
            user.setRole("ROLE_PATIENT");
            userRepository.save(user);

            Patient patient = new Patient();
            patient.setUser(user);
            patient.setName("Jane Doe");
            patient.setEmail("jane.doe@example.com");
            patient.setAge(34);
            patient.setBloodGroup("O+");
            patient.setMedicalInfo("Allergic to Penicillin");
            patientRepository.save(patient);

            MedicalRecord record1 = new MedicalRecord();
            record1.setPatient(patient);
            record1.setDiagnosis("Viral Fever");
            record1.setPrescription("Paracetamol 500mg, Rest for 3 days");
            record1.setDate(LocalDate.now().minusDays(10));
            record1.setDoctorName("Dr. Smith");
            recordRepository.save(record1);

            MedicalRecord record2 = new MedicalRecord();
            record2.setPatient(patient);
            record2.setDiagnosis("Routine Checkup");
            record2.setPrescription("Vitamin D supplements");
            record2.setDate(LocalDate.now());
            record2.setDoctorName("Dr. Alice");
            recordRepository.save(record2);
            System.out.println("Patient data seeded successfully.");
        }

        if (userRepository.findByUsername("doctor1").isEmpty()) {
            // Seed Doctor User
            User docUser = new User();
            docUser.setUsername("doctor1");
            docUser.setPassword(passwordEncoder.encode("docpass123"));
            docUser.setRole("ROLE_DOCTOR");
            userRepository.save(docUser);

            Doctor doctor = new Doctor();
            doctor.setUser(docUser);
            doctor.setName("Dr. Smith");
            doctor.setEmail("dr.smith@medisync.com");
            doctor.setSpecialization("General Physician");
            doctorRepository.save(doctor);
            
            System.out.println("Dummy data seeded successfully.");
        }

        if (userRepository.findByUsername("ak2205").isEmpty()) {
            User akUser = new User();
            akUser.setUsername("ak2205");
            akUser.setPassword(passwordEncoder.encode("password"));
            akUser.setRole("ROLE_DOCTOR");
            userRepository.save(akUser);

            Doctor akDoctor = new Doctor();
            akDoctor.setUser(akUser);
            akDoctor.setName("Dr. AK (Test)");
            akDoctor.setEmail("ak@medisync.com");
            akDoctor.setSpecialization("Superuser");
            doctorRepository.save(akDoctor);
            System.out.println("ak2205 seeded successfully.");
        }
    }
}
