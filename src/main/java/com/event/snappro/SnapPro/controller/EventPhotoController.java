package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.dto.EventPhotoResponseDTO;
import com.event.snappro.SnapPro.dto.EventPhotoUpdateDTO;
import com.event.snappro.SnapPro.service.EventPhotoService;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/photos")
public class EventPhotoController {

    private final EventPhotoService eventPhotoService;

    public EventPhotoController(EventPhotoService eventPhotoService) {
        this.eventPhotoService = eventPhotoService;
    }

    // =====================================================
    // SEP-02 - UPLOAD PHOTO FOR A CATALOG
    // =====================================================

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPhoto(

            HttpServletRequest request,

            @RequestParam("catalogId") Integer catalogId,

            @RequestParam("file") MultipartFile file,

            @RequestParam(value = "title", required = false) String title,

            @RequestParam(value = "description", required = false) String description) {
        try {
            EventPhotoResponseDTO response = eventPhotoService.uploadPhoto(
                    (String) request.getSession(false).getAttribute("userEmail"),
                    catalogId,
                    file,
                    title,
                    description);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message",
                    "Photo upload failed. Please contact the administrator if the problem continues."));
        }
    }

    // =====================================================
    // GET ALL ACTIVE PHOTOS
    // =====================================================

    @GetMapping
    public ResponseEntity<?> getAllPhotos() {
        try {
            return ResponseEntity.ok(
                    eventPhotoService.getAllPhotos());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    // =====================================================
    // GET PHOTOS BY CATALOG ID
    // =====================================================

    @GetMapping("/catalog/{catalogId}")
    public ResponseEntity<?> getPhotosByCatalog(
            @PathVariable Integer catalogId) {
        try {
            return ResponseEntity.ok(
                    eventPhotoService.getPhotosByCatalog(catalogId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    // =====================================================
    // GET ONE PHOTO
    // =====================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getPhotoById(
            @PathVariable Integer id) {
        try {
            return ResponseEntity.ok(
                    eventPhotoService.getPhotoById(id));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    // =====================================================
    // SEP-01 - GET PHOTOS BY EVENT
    // =====================================================

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getPhotosByBooking(
            @PathVariable Integer bookingId) {
        try {
            return ResponseEntity.ok(
                    eventPhotoService
                            .getPhotosByBooking(bookingId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    // =====================================================
    // SEP-05 - EDIT PHOTO DETAILS
    // =====================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePhoto(

            @PathVariable Integer id,

            @RequestBody EventPhotoUpdateDTO updateDTO) {
        try {
            return ResponseEntity.ok(
                    eventPhotoService
                            .updatePhoto(id, updateDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // =====================================================
    // SEP-06 - SOFT DELETE INDIVIDUAL PHOTO
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePhoto(
            @PathVariable Integer id) {
        try {
            eventPhotoService.deletePhoto(id);

            return ResponseEntity.ok(
                    Map.of("message", "Photo deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}