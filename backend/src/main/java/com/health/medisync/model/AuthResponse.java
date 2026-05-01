package com.health.medisync.model;

public class AuthResponse {
    private String token;
    private String role;
    private boolean emailVerified;

    public AuthResponse(String token, String role, boolean emailVerified) {
        this.token = token;
        this.role = role;
        this.emailVerified = emailVerified;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
}
