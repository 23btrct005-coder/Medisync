package com.health.medisync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication(excludeName = {
    "org.springframework.boot.autoconfigure.r2dbc.R2dbcAutoConfiguration",
    "org.springframework.boot.autoconfigure.r2dbc.R2dbcRepositoriesAutoConfiguration",
    "org.springframework.boot.autoconfigure.data.r2dbc.R2dbcDataAutoConfiguration"
})
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
        System.out.println("[DIAGNOSTIC] SPRING_DATASOURCE_URL: " + maskPassword(springUrl));
        System.out.println("[DIAGNOSTIC] DB_USER: " + dbUser);
        System.out.println("[DIAGNOSTIC] DB_PASSWORD Set: " + (dbPass != null && !dbPass.isEmpty() ? "YES" : "NO"));
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

    private static String maskPassword(String url) {
        if (url == null) return "Not Set";
        return url.replaceAll(":([^@/:]+)@", ":****@");
    }
}
