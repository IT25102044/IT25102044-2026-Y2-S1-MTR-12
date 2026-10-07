package com.event.snappro.SnapPro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDTO {
    private Integer id;
    private Integer customerId;
    private String customerName;
    private String customerEmail;
    private String customerMobile;
    private Integer packageId;
    private String packageTitle;
    private String eventTitle;
    private String eventLocation;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String customRequirements;
    private Double totalAmount;
    private Double balanceAmount;
    private Integer paymentMethodId;
    private String paymentMethod;
    private Integer bookingStatusId;
    private String bookingStatus;
    private LocalDateTime createdAt;
}
