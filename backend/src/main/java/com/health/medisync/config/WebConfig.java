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
 
     @Bean
     public FilterRegistrationBean<CorsFilter> corsFilter() {
         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
         CorsConfiguration config = new CorsConfiguration();
         config.setAllowCredentials(true);
         // Dynamic origin pattern matching to support Vercel preview/branch URLs
         config.setAllowedOriginPatterns(Collections.singletonList("*"));
         config.setAllowedHeaders(Arrays.asList(
             "Authorization", 
             "Cache-Control", 
             "Content-Type", 
             "X-Supabase-User",
             "Accept",
             "X-Requested-With",
             "Access-Control-Allow-Origin"
         ));
         config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
         config.setExposedHeaders(Arrays.asList("Authorization", "Access-Control-Allow-Origin"));
         source.registerCorsConfiguration("/**", config);
         
         FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
         bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
         return bean;
     }
 }
