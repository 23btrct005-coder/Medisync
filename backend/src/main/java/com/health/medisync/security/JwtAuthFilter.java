package com.health.medisync.security;

import com.health.medisync.controller.PinpointDiagnosticController;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthFilter(JwtUtils jwtUtils, CustomUserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        // Skip JWT filtering for all non-API and non-WebSocket requests (Frontend/SPA routes)
        return !path.startsWith("/api") && !path.startsWith("/ws");
    }

    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null) {
                if (jwt.startsWith("supabase_dummy_jwt_")) {
                    // Legacy dummy handling
                    String dummyEmail = request.getHeader("X-Supabase-User");
                    if(dummyEmail == null) dummyEmail = "supabase_user@domain.com";

                    UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                        .username(dummyEmail)
                        .password("")
                        .authorities(new SimpleGrantedAuthority("ROLE_PATIENT"))
                        .build();

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                } else {
                    boolean isValid = jwtUtils.validateToken(jwt);
                    if (isValid) {
                        try {
                            String username = jwtUtils.getUsernameFromToken(jwt);
                            Long userId = jwtUtils.getUserIdFromToken(jwt);
                            String role = jwtUtils.getRoleFromToken(jwt);
                            
                            System.out.println("DEBUG: AUTH_FILTER -> Token validated for " + username + " (ID: " + userId + ") with role: " + role);
                            
                            // Set context for RLS early
                            UserContext.setContext(userId, role);
                            
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        } catch (Exception e) {
                            String errMsg = "AUTH_ERROR: Token valid but User/Context missing: " + e.getMessage();
                            System.err.println("DEBUG: AUTH_FILTER -> " + errMsg);
                            PinpointDiagnosticController.setLastError(errMsg);
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"message\": \"Clinical session integrity lost. Please log in again.\"}");
                            return;
                        }
                    } else {
                        System.err.println("DEBUG: AUTH_FILTER -> JWT validation failed for token starting with: " + (jwt.length() > 10 ? jwt.substring(0, 10) : jwt));
                        PinpointDiagnosticController.setLastError("AUTH_ERROR: JWT validation failed.");
                        
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"message\": \"Clinical session expired or invalid. Access denied.\"}");
                        return;
                    }
                }
            }
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            // Unhandled filter exception
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\": \"A critical authentication fault occurred.\"}");
            return;
        } finally {
            UserContext.clear();
        }
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
