package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.dto.LoginDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ResponseDTO> login(@RequestBody LoginDTO loginDTO, HttpServletRequest request) {
        ResponseDTO response = authService.login(loginDTO, request);
        if (!response.isStatus()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<ResponseDTO> logout(HttpServletRequest request) {
        ResponseDTO response = authService.logout(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/session")
    public ResponseEntity<ResponseDTO> checkSession(HttpServletRequest request) {
        ResponseDTO response = authService.checkSession(request);
        if (!response.isStatus()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(response);
    }
}
