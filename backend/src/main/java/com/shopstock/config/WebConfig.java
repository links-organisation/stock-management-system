package com.shopstock.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        String shell = "forward:/index.html";

        // Prerendered routes: serve their own static HTML (more specific patterns win).
        registry.addViewController("/").setViewName("forward:/index.html");

        // Everything else (deep links) -> CSR shell. Segments exclude dots so static files pass through.
        // Covers up to 3 path segments - enough for the app's deepest routes (e.g. /invite/accept).
        registry.addViewController("/{p1:[^\\.]*}").setViewName(shell);
        registry.addViewController("/{p1:[^\\.]*}/{p2:[^\\.]*}").setViewName(shell);
        registry.addViewController("/{p1:[^\\.]*}/{p2:[^\\.]*}/{p3:[^\\.]*}").setViewName(shell);
    }
}
