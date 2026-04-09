import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@SpringBootApplication
public class MedisyncApplication {

    public static void main(String[] args) {
        // [STARTUP DIAGNOSTIC] - Check Environment BEFORE Spring context starts
        String rawUrl = System.getenv("DB_URL");
        String port = System.getenv("PORT");
        System.out.println("=================================================");
        System.out.println("[DIAGNOSTIC] JVM Started");
        System.out.println("[DIAGNOSTIC] Raw DB_URL (env): " + maskPassword(rawUrl));
        System.out.println("[DIAGNOSTIC] Port (env): " + port);
        System.out.println("=================================================");

        try {
            SpringApplication.run(MedisyncApplication.class, args);
        } catch (Exception e) {
            System.err.println("[CRITICAL] Application failed to start: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static String maskPassword(String url) {
        if (url == null) return "Not Set";
        return url.replaceAll(":([^@/:]+)@", ":****@");
    }
}
