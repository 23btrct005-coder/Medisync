package com.health.medisync.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex, WebRequest request) {
        ex.printStackTrace(); // Logs to Render console for deep inspection
        
        Map<String, Object> body = new HashMap<>();
        body.put("message", "A secure clinical node exception occurred.");
        body.put("error", ex.getMessage());
        body.put("type", ex.getClass().getName());
        body.put("path", request.getDescription(false));
        
        StackTraceElement[] trace = ex.getStackTrace();
        if (trace != null && trace.length > 0) {
            body.put("at", trace[0].toString());
        }
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
