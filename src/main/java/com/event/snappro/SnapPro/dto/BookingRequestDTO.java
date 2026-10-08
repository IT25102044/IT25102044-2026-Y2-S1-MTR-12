package com.event.snappro.SnapPro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDTO {
    private Integer packageId;
    private String eventTitle;
    private String eventLocation;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String customRequirements;
    private Integer paymentMethodId;
}
