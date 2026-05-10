package com.health.medisync.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentials(BadCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", "Invalid username or password identifier", "error", "AUTH_FAILURE"));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(org.springframework.security.access.AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("message", "Clinical authorization required for this operation", "error", "ACCESS_DENIED"));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(org.springframework.web.bind.MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .findFirst().orElse("Input validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("message", message, "error", "VALIDATION_ERROR"));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException e) {
        System.err.println("CONFLICT: Data Integrity Violation: " + e.getMessage());
        if (e.getCause() != null) {
            System.err.println("CAUSE: " + e.getCause().getMessage());
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("message", "A data conflict occurred. This record may already exist.", "error", "CONFLICT", "details", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception ex, WebRequest request) {
        System.err.println("CRITICAL: Clinical System Error: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
        ex.printStackTrace();
        
        Map<String, Object> body = new HashMap<>();
        String clinicalMessage = ex.getMessage() != null ? ex.getMessage() : "A secure clinical node exception occurred.";
        body.put("message", "[" + ex.getClass().getSimpleName() + "] " + clinicalMessage);
        body.put("error", ex.getMessage());
        body.put("type", ex.getClass().getName());
        body.put("path", request.getDescription(false));
        
        StackTraceElement[] trace = ex.getStackTrace();
        if (trace != null && trace.length > 0) {
            body.put("at", trace[0].toString());
        }
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
            .body(body);
    }
}
