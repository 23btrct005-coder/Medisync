import java.sql.*;

public class CheckUser {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/medisync";
        String user = "postgres";
        String password = "password";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("Checking User ID 1...");
            
            // Check User
            try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = 1")) {
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    System.out.println("User 1 found: " + rs.getString("username") + ", Role: " + rs.getString("role"));
                } else {
                    System.out.println("User 1 NOT FOUND in users table.");
                }
            }

            // Check Doctor
            try (PreparedStatement ps = conn.prepareStatement("SELECT id, name, user_id, profile_picture_url FROM doctors WHERE user_id = 1")) {
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    System.out.println("Doctor linked to User 1: ID=" + rs.getLong("id") + ", Name=" + rs.getString("name") + ", Pic=" + rs.getString("profile_picture_url"));
                } else {
                    System.out.println("No Doctor record found for user_id = 1");
                }
            }

            // Check Patient
            try (PreparedStatement ps = conn.prepareStatement("SELECT id, name, user_id, profile_picture_url FROM patients WHERE user_id = 1")) {
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    System.out.println("Patient linked to User 1: ID=" + rs.getLong("id") + ", Name=" + rs.getString("name") + ", Pic=" + rs.getString("profile_picture_url"));
                } else {
                    System.out.println("No Patient record found for user_id = 1");
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
