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
        Long userId = UserContext.getCurrentUserId();
        String role = UserContext.getCurrentUserRole();

        if (userId != null) {
            // Set current user ID for RLS
            entityManager.createNativeQuery("SET LOCAL medisync.current_user_id = :userId")
                    .setParameter("userId", userId.toString())
                    .executeUpdate();
            
            // Set current user role for RLS
            entityManager.createNativeQuery("SET LOCAL medisync.current_user_role = :role")
                    .setParameter("role", role != null ? role : "ROLE_PATIENT")
                    .executeUpdate();
        } else {
            // Reset variables for unauthenticated requests, though RLS will block them anyway
            entityManager.createNativeQuery("SET LOCAL medisync.current_user_id = '0'")
                    .executeUpdate();
            entityManager.createNativeQuery("SET LOCAL medisync.current_user_role = 'GUEST'")
                    .executeUpdate();
        }
    }
}
