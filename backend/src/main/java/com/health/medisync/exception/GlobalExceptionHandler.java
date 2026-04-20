package com.health.medisync.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

// Conflict resolved: Re-read original GlobalExceptionHandler in com.health.medisync.config
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(Exception ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", ex.getMessage());
        body.put("type", ex.getClass().getName());
        body.put("path", request.getDescription(false));
        body.put("phase", "global-interception");
        
        // Add first few lines of stack trace for deep debugging
        StackTraceElement[] trace = ex.getStackTrace();
        if (trace != null && trace.length > 0) {
            body.put("at", trace[0].toString());
            if (trace.length > 1) body.put("caused_by", trace[1].toString());
        }

        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
