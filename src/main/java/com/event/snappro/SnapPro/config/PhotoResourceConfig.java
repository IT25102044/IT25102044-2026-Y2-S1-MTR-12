package com.event.snappro.SnapPro.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class PhotoResourceConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/event-photos}")
    private String uploadDirectory;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        Path photoDirectory = Path.of(uploadDirectory)
                .toAbsolutePath()
                .normalize();

        String location = photoDirectory.toUri().toString();

        if (!location.endsWith("/")) {
            location += "/";
        }

        registry.addResourceHandler("/uploads/event-photos/**")
                .addResourceLocations(location);
    }
}
