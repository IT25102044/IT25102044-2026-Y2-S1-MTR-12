package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.dto.AdminBookingUpdateDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import jakarta.servlet.http.HttpServletRequest;

public interface AdminBookingService {
    ResponseDTO getAllBookings();
    ResponseDTO getBookingById(Integer id);
    ResponseDTO updateBooking(Integer id, AdminBookingUpdateDTO dto, HttpServletRequest request);
    ResponseDTO getBookingStatistics();
    ResponseDTO getAllBookingStatuses();
    ResponseDTO getAllPaymentMethods();
}
