package com.health.medisync.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = {
        "/dashboard",
        "/dashboard/**",
        "/doctor-dashboard",
        "/doctor-dashboard/**",
        "/hospital-dashboard",
        "/hospital-dashboard/**",
        "/admin-dashboard",
        "/admin-dashboard/**",
        "/login",
        "/register",
        "/booking",
        "/booking/**",
        "/reports",
        "/reports/**",
        "/settings",
        "/settings/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
