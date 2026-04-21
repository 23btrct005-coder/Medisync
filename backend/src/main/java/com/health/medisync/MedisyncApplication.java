package com.health.medisync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.model.User;
import java.util.Optional;

@SpringBootApplication(excludeName = {
    "org.springframework.boot.autoconfigure.r2dbc.R2dbcAutoConfiguration",
    "org.springframework.boot.autoconfigure.r2dbc.R2dbcRepositoriesAutoConfiguration",
    "org.springframework.boot.autoconfigure.data.r2dbc.R2dbcDataAutoConfiguration"
})
@EnableScheduling
@EnableAsync
@EnableCaching
public class MedisyncApplication {

    static {
        // Force long timeout for slow remote DB handshakes
        System.setProperty("sun.net.client.defaultConnectTimeout", "30000");
        System.setProperty("sun.net.client.defaultReadTimeout", "30000");
    }

    public static void main(String[] args) {
        // [STARTUP DIAGNOSTIC] - Check Environment BEFORE Spring context starts
        String springUrl = System.getenv("SPRING_DATASOURCE_URL");
        String legacyUrl = System.getenv("DB_URL");
        String dbUser = System.getenv("SPRING_DATASOURCE_USERNAME");
        String dbPass = System.getenv("SPRING_DATASOURCE_PASSWORD");
        String port = System.getenv("PORT");

        System.out.println("=================================================");
        System.out.println("[DIAGNOSTIC] JVM Started");
        System.out.println("[DIAGNOSTIC] FINAL MATCH: Mumbai aws-1 (3.111.225.200)");
        System.out.println("[DIAGNOSTIC] PROJECT: bwjmzottkkxrdztqqeju");
        System.out.println("[DIAGNOSTIC] SPRING_DATASOURCE_URL: " + maskPassword(springUrl));
        System.out.println("[DIAGNOSTIC] DB_USER env: " + dbUser);
        System.out.println("[DIAGNOSTIC] Port (env): " + port);
        System.out.println("=================================================");
        System.out.flush(); // Force Render to show logs immediately

        try {
            SpringApplication.run(MedisyncApplication.class, args);
        } catch (Exception e) {
            System.err.println("[CRITICAL] Application failed to start: " + e.getMessage());
            e.printStackTrace();
            System.err.flush();
        }
    }

    @Bean
    public CommandLineRunner patientIdBootstrap(com.health.medisync.repository.PatientRepository patientRepository) {
        return args -> {
            System.out.println("[BOOTSTRAP] Checking for missing Patient IDs...");
            long count = patientRepository.findAll().stream()
                .filter(p -> p.getPatientId() == null || p.getPatientId().startsWith("MS-TEMP"))
                .peek(p -> p.setPatientId("MS-" + String.format("%04d", p.getId())))
                .map(patientRepository::save)
                .count();
            
            if (count > 0) {
                System.out.println("[BOOTSTRAP] Successfully generated MS-XXXX IDs for " + count + " existing patients.");
            } else {
                System.out.println("[BOOTSTRAP] All patients already have valid IDs.");
            }
        };
    }

    @Bean
    public CommandLineRunner adminBootstrap(UserRepository userRepository) {
        return args -> {
            System.out.println("[BOOTSTRAP] Checking for admin promotion...");
            
            // Fix for 'admin' (Global ID 3 in screenshot)
            Optional<User> adminUser = userRepository.findAll().stream()
                .filter(u -> u.getUsername().equalsIgnoreCase("admin") || u.getUsername().equalsIgnoreCase("admin@medisync.com"))
                .findFirst();

            if (adminUser.isPresent()) {
                User user = adminUser.get();
                if (!"ROLE_ADMIN".equals(user.getRole())) {
                    System.out.println("[BOOTSTRAP] Promoting user '" + user.getUsername() + "' to ROLE_ADMIN");
                    user.setRole("ROLE_ADMIN");
                    user.setEnabled(true);
                    userRepository.save(user);
                    System.out.println("[BOOTSTRAP] Promotion successful!");
                } else {
                    System.out.println("[BOOTSTRAP] User '" + user.getUsername() + "' is already ROLE_ADMIN");
                }
            } else {
                System.out.println("[BOOTSTRAP] No user named 'admin' found for promotion.");
            }
        };
    }

    private static String maskPassword(String url) {
        if (url == null) return "Not Set";
        return url.replaceAll(":([^@/:]+)@", ":****@");
    }
}
