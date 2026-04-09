import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@SpringBootApplication
public class MedisyncApplication {

    @Value("${spring.datasource.url:Not Set}")
    private String dbUrl;

    @Value("${server.port:8080}")
    private String port;

    public static void main(String[] args) {
        SpringApplication.run(MedisyncApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logDiagnostics() {
        System.out.println("=================================================");
        System.out.println("[DIAGNOSTIC] App started on port: " + port);
        System.out.println("[DIAGNOSTIC] DB URL: " + maskPassword(dbUrl));
        System.out.println("=================================================");
    }

    private String maskPassword(String url) {
        if (url == null) return "null";
        // Simple mask for security
        return url.replaceAll(":([^@/:]+)@", ":****@");
    }
}
