package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.dto.BookingRequestDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.service.BookingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ResponseDTO> createBooking(@RequestBody BookingRequestDTO requestDTO, HttpServletRequest request) {
        ResponseDTO response = bookingService.createBooking(requestDTO, request);
        if (!response.isStatus()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<ResponseDTO> getMyBookings(HttpServletRequest request) {
        ResponseDTO response = bookingService.getCustomerBookings(request);
        if (!response.isStatus()) {
            return ResponseEntity.status(401).body(response);
        }
        return ResponseEntity.ok(response);
    }
}
