package com.health.medisync.security;

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

                } else if (jwtUtils.validateToken(jwt)) {
                    try {
                        String username = jwtUtils.getUsernameFromToken(jwt);
                        Long userId = jwtUtils.getUserIdFromToken(jwt);
                        String role = jwtUtils.getRoleFromToken(jwt);
                        
                        // Set context for RLS early
                        UserContext.setContext(userId, role);
                        
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } catch (Exception e) {
                        // If token is valid but user context is missing from DB (e.g. after a reset)
                        // we must halt the chain and ask for re-authentication to prevent 500s later
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"message\": \"Clinical session integrity lost. Please log in again.\"}");
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
