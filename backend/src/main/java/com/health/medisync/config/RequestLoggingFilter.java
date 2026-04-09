package com.health.medisync.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            System.out.println("DEBUG: Incoming Request -> Method: " + httpRequest.getMethod() 
                + " | URL: " + httpRequest.getRequestURL()
                + " | URI: " + httpRequest.getRequestURI()
                + " | Origin: " + httpRequest.getHeader("Origin"));
        }
        chain.doFilter(request, response);
    }
}
