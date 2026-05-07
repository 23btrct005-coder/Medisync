package com.health.medisync;

import com.health.medisync.model.*;
import com.health.medisync.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

import org.springframework.context.annotation.Profile;

@Component
@Profile("local")
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
            patient.setName("Arjun Kumar");
            patient.setEmail("arjun.kumar@medisync.io");
            patient.setAge(28);
            patient.setBloodGroup("O+");
            patient.setMedicalInfo("None reported");
            patientRepository.save(patient);

            MedicalRecord record1 = new MedicalRecord();
            record1.setPatient(patient);
            record1.setDiagnosis("Hypertension Management");
            record1.setPrescription("Amlodipine 5mg OD, Low sodium diet");
            record1.setDate(LocalDate.now().minusDays(10));
            record1.setDoctorName("Dr. Sarah Jenkins");
            recordRepository.save(record1);

            MedicalRecord record2 = new MedicalRecord();
            record2.setPatient(patient);
            record2.setDiagnosis("Routine Clinical Assessment");
            record2.setPrescription("Multivitamin supplements, Regular exercise");
            record2.setDate(LocalDate.now());
            record2.setDoctorName("Dr. Sarah Jenkins");
            recordRepository.save(record2);
            System.out.println("High-fidelity patient data seeded successfully.");
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
            doctor.setName("Dr. Sarah Jenkins");
            doctor.setEmail("s.jenkins@medisync.com");
            doctor.setSpecialization("Cardiology");
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

        if (userRepository.findByUsername("doc@gmail.com").isEmpty()) {
            User testDoc = new User();
            testDoc.setUsername("doc@gmail.com");
            testDoc.setPassword(passwordEncoder.encode("password"));
            testDoc.setRole("ROLE_DOCTOR");
            userRepository.save(testDoc);

            Doctor doctor = new Doctor();
            doctor.setUser(testDoc);
            doctor.setName("Test Doctor (DOC)");
            doctor.setEmail("doc@gmail.com");
            doctor.setSpecialization("General");
            doctorRepository.save(doctor);
            System.out.println("doc@gmail.com seeded successfully.");
        }
    }
}
