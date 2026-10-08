package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.dto.PhotographerProfileUpdateDTO;
import com.event.snappro.SnapPro.service.PhotographerProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class PhotographerProfileController {
    private final PhotographerProfileService service;
    public PhotographerProfileController(PhotographerProfileService service) { this.service = service; }

    private String currentEmail(HttpServletRequest request) {
        return (String) request.getSession(false).getAttribute("userEmail");
    }

    @GetMapping
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        return ResponseEntity.ok(service.getProfile(currentEmail(request)));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(HttpServletRequest request,
                                            @Valid @RequestBody PhotographerProfileUpdateDTO dto) {
        return ResponseEntity.ok(service.updateProfile(currentEmail(request), dto));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword() {
        return ResponseEntity.status(409).body(Map.of("message",
                "Password change is unavailable until the group's authentication is upgraded to password hashing."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalid(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}
