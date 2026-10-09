package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.dto.BookingEventResponseDTO;

import java.util.List;

public interface EventBookingService {

    List<BookingEventResponseDTO> getAllBookings();
}