package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.entity.EventBookingEntity;

public interface EmailService {
    void sendBookingConfirmationEmail(String toEmail, String customerName, EventBookingEntity booking);
}
