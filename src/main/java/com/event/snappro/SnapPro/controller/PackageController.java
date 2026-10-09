package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.service.PackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class PackageController {

    private final PackageService packageService;

    @GetMapping
    public ResponseEntity<ResponseDTO> getActivePackages() {
        ResponseDTO response = packageService.getAllActivePackages();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<ResponseDTO> getAllPackages() {
        ResponseDTO response = packageService.getAllPackages();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO> getPackageById(@PathVariable Integer id) {
        ResponseDTO response = packageService.getPackageById(id);
        if (!response.isStatus()) {
            return ResponseEntity.status(404).body(response);
        }
        return ResponseEntity.ok(response);
    }
}
