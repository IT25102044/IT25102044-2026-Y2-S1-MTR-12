package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.dto.CreateUserDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.dto.UpdateUserDTO;
import com.event.snappro.SnapPro.service.AdminUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ResponseDTO> getAllUsers() {
        ResponseDTO response = adminUserService.getAllUsers();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO> getUserById(@PathVariable Integer id) {
        ResponseDTO response = adminUserService.getUserById(id);
        if (!response.isStatus()) {
            return ResponseEntity.status(404).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ResponseDTO> createUser(@RequestBody CreateUserDTO createUserDTO, HttpServletRequest request) {
        ResponseDTO response = adminUserService.createUser(createUserDTO, request);
        if (!response.isStatus()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseDTO> updateUser(@PathVariable Integer id, @RequestBody UpdateUserDTO updateUserDTO, HttpServletRequest request) {
        ResponseDTO response = adminUserService.updateUser(id, updateUserDTO, request);
        if (!response.isStatus()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<ResponseDTO> toggleUserStatus(@PathVariable Integer id, HttpServletRequest request) {
        ResponseDTO response = adminUserService.toggleUserStatus(id, request);
        if (!response.isStatus()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO> deleteUser(@PathVariable Integer id, HttpServletRequest request) {
        ResponseDTO response = adminUserService.deleteUser(id, request);
        if (!response.isStatus()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statistics")
    public ResponseEntity<ResponseDTO> getUserStatistics() {
        ResponseDTO response = adminUserService.getUserStatistics();
        return ResponseEntity.ok(response);
    }
}
