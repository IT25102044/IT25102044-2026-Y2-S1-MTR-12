package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.dto.BookingRequestDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import jakarta.servlet.http.HttpServletRequest;

public interface BookingService {
    ResponseDTO createBooking(BookingRequestDTO requestDTO, HttpServletRequest request);
    ResponseDTO getCustomerBookings(HttpServletRequest request);
}
