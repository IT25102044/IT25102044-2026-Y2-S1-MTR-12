package com.event.snappro.SnapPro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookedSlotDTO {
    private Integer bookingId;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String bookingStatus;
    private String eventTitle;
}
