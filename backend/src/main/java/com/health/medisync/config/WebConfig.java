package com.health.medisync.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Force all frontend routes to serve index.html directly at the MVC level
        registry.addViewController("/dashboard").setViewName("forward:/index.html");
        registry.addViewController("/dashboard/**").setViewName("forward:/index.html");
        registry.addViewController("/doctor-dashboard").setViewName("forward:/index.html");
        registry.addViewController("/doctor-dashboard/**").setViewName("forward:/index.html");
        registry.addViewController("/hospital-dashboard").setViewName("forward:/index.html");
        registry.addViewController("/hospital-dashboard/**").setViewName("forward:/index.html");
        registry.addViewController("/admin-dashboard").setViewName("forward:/index.html");
        registry.addViewController("/admin-dashboard/**").setViewName("forward:/index.html");
        registry.addViewController("/login").setViewName("forward:/index.html");
        registry.addViewController("/register").setViewName("forward:/index.html");
        registry.addViewController("/doctor-login").setViewName("forward:/index.html");
        registry.addViewController("/forgot-password").setViewName("forward:/index.html");
        registry.addViewController("/reset-password").setViewName("forward:/index.html");
        registry.addViewController("/verify-email").setViewName("forward:/index.html");
        registry.addViewController("/pending-approval").setViewName("forward:/index.html");
        registry.addViewController("/privacy-policy").setViewName("forward:/index.html");
        registry.addViewController("/terms-of-service").setViewName("forward:/index.html");
        registry.addViewController("/ai-disclaimer").setViewName("forward:/index.html");
        registry.addViewController("/booking/**").setViewName("forward:/index.html");
        registry.addViewController("/reports/**").setViewName("forward:/index.html");
        registry.addViewController("/settings/**").setViewName("forward:/index.html");
        registry.addViewController("/emergency/**").setViewName("forward:/index.html");
    }
}
