import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheck {
    public static void main(String[] args) throws Exception {
        Class.forName("org.postgresql.Driver");
        String url = "jdbc:postgresql://db.ggcecwmxxuhadtihmjxf.supabase.co:5432/postgres?ssl=true&sslmode=require&sslfactory=org.postgresql.ssl.NonValidatingFactory";
        Connection conn = DriverManager.getConnection(url, "postgres", "Medisync2024");
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT id, name, latitude, longitude FROM hospitals WHERE name LIKE '%Narayana%'");
        while (rs.next()) {
            System.out.println(rs.getString("name") + " | Lat: " + rs.getObject("latitude") + " | Lng: " + rs.getObject("longitude"));
        }
        
        // Ensure lat/lng are set
        stmt.executeUpdate("UPDATE hospitals SET latitude = 12.8123, longitude = 77.6974 WHERE name LIKE '%Narayana%' AND (latitude IS NULL OR longitude IS NULL)");
        System.out.println("Ensured Narayana Health City lat/lng.");
        conn.close();
    }
}
