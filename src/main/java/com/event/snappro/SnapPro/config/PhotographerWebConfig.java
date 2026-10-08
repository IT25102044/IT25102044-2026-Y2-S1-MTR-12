package com.event.snappro.SnapPro.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;

@Configuration
public class PhotographerWebConfig implements WebMvcConfigurer {
    private final PhotographerSessionInterceptor access;
    public PhotographerWebConfig(PhotographerSessionInterceptor access) { this.access = access; }

    @Value("${app.upload.dir:uploads/event-photos}")
    private String uploadDirectory;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(access).addPathPatterns(
                "/photographer.html", "/api/photographer/**",
                "/api/catalogs", "/api/catalogs/**",
                "/api/photos", "/api/photos/**",
                "/api/profile", "/api/profile/**",
                "/uploads/event-photos/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path photoPath = Path.of(uploadDirectory).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/event-photos/**")
                .addResourceLocations(photoPath.toUri().toString());
    }
}
