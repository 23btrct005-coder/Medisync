import java.sql.*;
public class FixDB {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://db.ggcecwmxxuhadtihmjxf.supabase.co:5432/postgres?ssl=true&sslmode=require&sslfactory=org.postgresql.ssl.NonValidatingFactory";
        try (Connection conn = DriverManager.getConnection(url, "postgres", "Medisync2024")) {
            Statement stmt = conn.createStatement();
            int rows = stmt.executeUpdate("UPDATE doctors SET institutional = false WHERE hospital_entity_id IS NULL AND institutional = true;");
            System.out.println("Rows updated: " + rows);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
