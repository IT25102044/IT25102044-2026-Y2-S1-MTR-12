package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.dto.AdminBookingUpdateDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.service.AdminBookingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/bookings")
@RequiredArgsConstructor
public class AdminBookingController {

    private final AdminBookingService adminBookingService;

    @GetMapping
    public ResponseEntity<ResponseDTO> getAllBookings() {
        ResponseDTO response = adminBookingService.getAllBookings();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO> getBookingById(@PathVariable Integer id) {
        ResponseDTO response = adminBookingService.getBookingById(id);
        if (!response.isStatus()) {
            return ResponseEntity.status(404).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseDTO> updateBooking(@PathVariable Integer id, @RequestBody AdminBookingUpdateDTO updateDTO, HttpServletRequest request) {
        ResponseDTO response = adminBookingService.updateBooking(id, updateDTO, request);
        if (!response.isStatus()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statistics")
    public ResponseEntity<ResponseDTO> getBookingStatistics() {
        ResponseDTO response = adminBookingService.getBookingStatistics();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statuses")
    public ResponseEntity<ResponseDTO> getAllBookingStatuses() {
        ResponseDTO response = adminBookingService.getAllBookingStatuses();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<ResponseDTO> getAllPaymentMethods() {
        ResponseDTO response = adminBookingService.getAllPaymentMethods();
        return ResponseEntity.ok(response);
    }
}
