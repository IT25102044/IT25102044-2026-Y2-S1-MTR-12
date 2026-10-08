package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.BookingEventResponseDTO;
import com.event.snappro.SnapPro.repository.EventBookingRepository;
import com.event.snappro.SnapPro.service.EventBookingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EventBookingServiceImpl implements EventBookingService {

    private final EventBookingRepository eventBookingRepository;

    public EventBookingServiceImpl(EventBookingRepository eventBookingRepository) {
        this.eventBookingRepository = eventBookingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingEventResponseDTO> getAllBookings() {
        return eventBookingRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(booking -> booking.getBookingStatus() != null
                        && "COMPLETED".equalsIgnoreCase(booking.getBookingStatus().getBookingStatus().trim()))
                .map(booking -> new BookingEventResponseDTO(
                        booking.getId(),
                        booking.getEventTitle(),
                        booking.getEventLocation(),
                        booking.getEventDate(),
                        booking.getStartTime(),
                        booking.getEndTime()))
                .toList();
    }
}