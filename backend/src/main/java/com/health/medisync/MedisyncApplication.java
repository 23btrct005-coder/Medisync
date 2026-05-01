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
import com.health.medisync.utils.GeographicalMappingUtils;
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
        
        // [DATABASE SELF-HEALING] - Resolve Supabase Pooler Timeouts & Statement Conflicts
        if (springUrl != null && (springUrl.contains(".pooler.supabase.com") || springUrl.contains(".supabase.co"))) {
            boolean updated = false;
            if (springUrl.contains(":5432")) {
                System.out.println("[SELF-HEALING] Detected direct port 5432. Re-routing to Session Pooler (6543).");
                springUrl = springUrl.replace(":5432", ":6543");
                updated = true;
            }
            if (!springUrl.contains("prepareThreshold=0")) {
                System.out.println("[SELF-HEALING] Suppressing prepared statements for Transaction Mode compatibility.");
                String separator = springUrl.contains("?") ? "&" : "?";
                springUrl += separator + "prepareThreshold=0";
                updated = true;
            }
            if (updated) {
                System.setProperty("spring.datasource.url", springUrl);
            }
        }

        String dbUser = System.getenv("SPRING_DATASOURCE_USERNAME");
        String port = System.getenv("PORT");

        System.out.println("=================================================");
        System.out.println("[DIAGNOSTIC] JVM Started");
        System.out.println("[DIAGNOSTIC] DB_HEALTH: Attempting connection to Session Pooler (6543)");
        System.out.println("[DIAGNOSTIC] PROJECT: bwjmzottkkxrdztqqeju");
        System.out.println("[DIAGNOSTIC] SPRING_DATASOURCE_URL: " + maskPassword(springUrl));
        System.out.println("[DIAGNOSTIC] DB_USER env: " + dbUser);
        System.out.println("[DIAGNOSTIC] Port (env): " + port);
        System.out.println("=================================================");
        System.out.flush();

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
            System.out.println("[BOOTSTRAP] Checking for Patient ID updates/migrations...");
            long count = patientRepository.findAll().stream()
                .filter(p -> p.getPatientId() == null || p.getPatientId().startsWith("MS-") || p.getPatientId().startsWith("MS-TEMP") || p.getPatientId().startsWith("XX-") || p.getPatientId().contains("-00-"))
                .peek(p -> {
                    String stateCode = GeographicalMappingUtils.getStateCode(p.getState());
                    String districtCode = GeographicalMappingUtils.getDistrictCode(p.getState(), p.getDistrict(), p.getCity());
                    String sequence = String.format("%04d", p.getId());
                    p.setPatientId(stateCode + "-" + districtCode + "-" + sequence);
                })
                .map(patientRepository::save)
                .count();
            
            if (count > 0) {
                System.out.println("[BOOTSTRAP] Successfully migrated/generated IDs for " + count + " patients to the regional format.");
            } else {
                System.out.println("[BOOTSTRAP] All patients are already using the regional ID format.");
            }
        };
    }

    @Bean
    public CommandLineRunner adminBootstrap(UserRepository userRepository, 
                                           org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                                           org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return args -> {
            // 🚀 DATABASE SELF-HEALING: Add email_verified if missing
            try {
                System.out.println("[BOOTSTRAP] Verifying User Schema integrity...");
                jdbcTemplate.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE");
                System.out.println("[BOOTSTRAP] User Schema synchronized.");
            } catch (Exception e) {
                System.out.println("[BOOTSTRAP] Schema sync info: " + e.getMessage());
            }

            System.out.println("[BOOTSTRAP] Checking for global admin account...");
            
            Optional<User> adminUser = userRepository.findByUsernameIgnoreCase("admin");

            if (adminUser.isEmpty()) {
                System.out.println("[BOOTSTRAP] No admin user found. Creating global 'admin' account...");
                User newAdmin = new User();
                newAdmin.setUsername("admin");
                newAdmin.setPassword(passwordEncoder.encode("admin123"));
                newAdmin.setRole("ROLE_ADMIN");
                newAdmin.setEnabled(true);
                userRepository.save(newAdmin);
                System.out.println("[BOOTSTRAP] Global admin created successfully.");
            } else {
                System.out.println("[BOOTSTRAP] Admin user exists. Persistence mode active.");
            }
        };
    }

    private static String maskPassword(String url) {
        if (url == null) return "Not Set";
        return url.replaceAll(":([^@/:]+)@", ":****@");
    }
}
