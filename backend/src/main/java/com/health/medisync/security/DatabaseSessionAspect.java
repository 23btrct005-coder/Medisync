package com.health.medisync.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Aspect
@Component
public class DatabaseSessionAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Before("@annotation(org.springframework.transaction.annotation.Transactional) || @within(org.springframework.transaction.annotation.Transactional)")
    public void setPostgresSessionVariables() {
        try {
            Long userId = UserContext.getCurrentUserId();
            String role = UserContext.getCurrentUserRole();

            // Only execute if we have a valid connection and context
            if (entityManager != null && entityManager.isOpen()) {
                if (userId != null) {
                    // Set current user ID for RLS using set_config (avoids bind parameter issues in SET LOCAL)
                    entityManager.createNativeQuery("SELECT set_config('medisync.current_user_id', :userId, true)")
                            .setParameter("userId", userId.toString())
                            .getSingleResult();
                    
                    // Set current user role for RLS
                    entityManager.createNativeQuery("SELECT set_config('medisync.current_user_role', :role, true)")
                            .setParameter("role", role != null ? role : "ROLE_PATIENT")
                            .getSingleResult();
                } else {
                    // Reset variables for unauthenticated requests
                    entityManager.createNativeQuery("SELECT set_config('medisync.current_user_id', '0', true)")
                            .getSingleResult();
                    entityManager.createNativeQuery("SELECT set_config('medisync.current_user_role', 'GUEST', true)")
                            .getSingleResult();
                }
            }
        } catch (Exception e) {
            // Log the error but don't crash the entire request if RLS variables fail to set
            // In a production environment, this should be logged to a monitoring service
            System.err.println("CRITICAL: Failed to set clinical RLS session variables: " + e.getMessage());
            // We don't rethrow to avoid a 500 error if the DB is temporarily in a state where SET LOCAL fails
            // Access will still be blocked by RLS policies if variables aren't set correctly
        }
    }
}
