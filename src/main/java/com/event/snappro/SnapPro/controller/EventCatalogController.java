package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.dto.CatalogRequestDTO;
import com.event.snappro.SnapPro.dto.CatalogResponseDTO;
import com.event.snappro.SnapPro.dto.CatalogUpdateDTO;
import com.event.snappro.SnapPro.service.EventCatalogService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/catalogs")
public class EventCatalogController {

    private final EventCatalogService eventCatalogService;


    public EventCatalogController(EventCatalogService eventCatalogService) {
        this.eventCatalogService = eventCatalogService;
    }


    // =====================================================
    // POST /api/catalogs - CREATE CATALOG MANUALLY
    // =====================================================

    @PostMapping
    public ResponseEntity<?> createCatalog(
            @Valid @RequestBody CatalogRequestDTO request
    ) {
        try {
            CatalogResponseDTO response = eventCatalogService.createCatalog(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to create catalog: " + e.getMessage()));
        }
    }


    // =====================================================
    // GET /api/catalogs - GET ALL CATALOGS
    // =====================================================

    @GetMapping
    public ResponseEntity<List<CatalogResponseDTO>> getAllCatalogs() {
        return ResponseEntity.ok(eventCatalogService.getAllCatalogs());
    }


    // =====================================================
    // GET /api/catalogs/booking/{bookingId}
    // =====================================================

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<CatalogResponseDTO>> getCatalogsByBooking(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(eventCatalogService.getCatalogsByBooking(bookingId));
    }


    // =====================================================
    // GET /api/catalogs/{id}
    // =====================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getCatalogById(
            @PathVariable Integer id
    ) {
        try {
            return ResponseEntity.ok(eventCatalogService.getCatalogById(id));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }


    // =====================================================
    // PUT /api/catalogs/{id} - EDIT ALBUM NAME / DESCRIPTION
    // =====================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCatalog(
            @PathVariable Integer id,
            @Valid @RequestBody CatalogUpdateDTO request
    ) {
        try {
            return ResponseEntity.ok(eventCatalogService.updateCatalog(id, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to update album."));
        }
    }


    // =====================================================
    // DELETE /api/catalogs/{id} - HARD CASCADE DELETE
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCatalog(
            @PathVariable Integer id
    ) {
        try {
            eventCatalogService.deleteCatalog(id);
            return ResponseEntity.ok(Map.of("message", "Catalog and all associated photos deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
