package com.event.snappro.SnapPro.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class BookingEventResponseDTO {

    private Integer id;
    private String eventTitle;
    private String eventLocation;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;

    public BookingEventResponseDTO() {
    }

    public BookingEventResponseDTO(
            Integer id,
            String eventTitle,
            String eventLocation,
            LocalDate eventDate,
            LocalTime startTime,
            LocalTime endTime) {
        this.id = id;
        this.eventTitle = eventTitle;
        this.eventLocation = eventLocation;
        this.eventDate = eventDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Integer getId() {
        return id;
    }

    public String getEventTitle() {
        return eventTitle;
    }

    public String getEventLocation() {
        return eventLocation;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }
}