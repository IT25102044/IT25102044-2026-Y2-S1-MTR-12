package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.dto.BookingEventResponseDTO;
import com.event.snappro.SnapPro.service.EventBookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/photographer/bookings")
public class EventBookingController {

    private final EventBookingService eventBookingService;

    public EventBookingController(EventBookingService eventBookingService) {
        this.eventBookingService = eventBookingService;
    }

    @GetMapping
    public ResponseEntity<List<BookingEventResponseDTO>> getAllBookings() {
        return ResponseEntity.ok(eventBookingService.getAllBookings());
    }
}