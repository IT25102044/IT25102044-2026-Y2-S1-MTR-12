package com.event.snappro.SnapPro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingStatsDTO {
    private long totalBookings;
    private long pendingBookings;
    private long confirmedBookings;
    private long cancelledBookings;
}
