package com.health.medisync.config;
 
 import org.springframework.context.annotation.Bean;
 import org.springframework.context.annotation.Configuration;
 import org.springframework.core.Ordered;
 import org.springframework.boot.web.servlet.FilterRegistrationBean;
 import org.springframework.web.cors.CorsConfiguration;
 import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
 import org.springframework.web.filter.CorsFilter;
 import java.util.Arrays;
 import java.util.Collections;
 
 @Configuration
public class WebConfig {
    // Other web-specific configurations can go here (Interceptors, etc.)
}
