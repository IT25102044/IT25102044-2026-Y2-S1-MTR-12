package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.AdminBookingUpdateDTO;
import com.event.snappro.SnapPro.dto.BookingResponseDTO;
import com.event.snappro.SnapPro.dto.BookingStatsDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.entity.BookingStatusEntity;
import com.event.snappro.SnapPro.entity.EventBookingEntity;
import com.event.snappro.SnapPro.entity.PaymentMethodEntity;
import com.event.snappro.SnapPro.repository.BookingStatusRepository;
import com.event.snappro.SnapPro.repository.EventBookingRepository;
import com.event.snappro.SnapPro.repository.PaymentMethodRepository;
import com.event.snappro.SnapPro.service.AdminBookingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminBookingServiceImpl implements AdminBookingService {

    private final EventBookingRepository eventBookingRepository;
    private final BookingStatusRepository bookingStatusRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final ModelMapper modelMapper;

    @Override
    public ResponseDTO getAllBookings() {
        List<EventBookingEntity> bookings = eventBookingRepository.findAllByOrderByCreatedAtDesc();
        List<BookingResponseDTO> dtoList = bookings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return new ResponseDTO(true, "Bookings retrieved successfully.", dtoList);
    }

    @Override
    public ResponseDTO getBookingById(Integer id) {
        Optional<EventBookingEntity> optional = eventBookingRepository.findById(id);
        if (optional.isEmpty()) {
            return new ResponseDTO(false, "Booking not found with ID: " + id, null);
        }
        return new ResponseDTO(true, "Booking found.", convertToDTO(optional.get()));
    }

    @Override
    public ResponseDTO updateBooking(Integer id, AdminBookingUpdateDTO dto, HttpServletRequest request) {
        Optional<EventBookingEntity> optional = eventBookingRepository.findById(id);
        if (optional.isEmpty()) {
            return new ResponseDTO(false, "Booking not found with ID: " + id, null);
        }

        if (dto == null) {
            return new ResponseDTO(false, "Invalid booking update payload.", null);
        }

        EventBookingEntity booking = optional.get();

        if (dto.getEventTitle() != null && !dto.getEventTitle().trim().isEmpty()) {
            booking.setEventTitle(dto.getEventTitle().trim());
        }
        if (dto.getEventLocation() != null && !dto.getEventLocation().trim().isEmpty()) {
            booking.setEventLocation(dto.getEventLocation().trim());
        }
        if (dto.getEventDate() != null) {
            booking.setEventDate(dto.getEventDate());
        }
        if (dto.getStartTime() != null) {
            booking.setStartTime(dto.getStartTime());
        }
        if (dto.getEndTime() != null) {
            booking.setEndTime(dto.getEndTime());
        }
        if (booking.getStartTime() != null && booking.getEndTime() != null && !booking.getEndTime().isAfter(booking.getStartTime())) {
            return new ResponseDTO(false, "Event end time must be after start time.", null);
        }

        // Update Booking Status
        if (dto.getBookingStatusId() != null || (dto.getBookingStatus() != null && !dto.getBookingStatus().trim().isEmpty())) {
            BookingStatusEntity resolvedStatus = resolveBookingStatus(dto.getBookingStatusId(), dto.getBookingStatus());
            if (resolvedStatus != null) {
                booking.setBookingStatus(resolvedStatus);
            }
        }

        // Check for time slot overlap with other active bookings (unless this booking is cancelled)
        boolean isCancelled = booking.getBookingStatus() != null && "cancelled".equalsIgnoreCase(booking.getBookingStatus().getBookingStatus());
        if (!isCancelled && booking.getEventDate() != null && booking.getStartTime() != null && booking.getEndTime() != null) {
            List<EventBookingEntity> activeOnDate = eventBookingRepository.findActiveBookingsByDate(booking.getEventDate());
            for (EventBookingEntity other : activeOnDate) {
                if (!other.getId().equals(booking.getId()) && other.getStartTime() != null && other.getEndTime() != null) {
                    if (booking.getStartTime().isBefore(other.getEndTime()) && booking.getEndTime().isAfter(other.getStartTime())) {
                        String cStart = other.getStartTime().toString().substring(0, 5);
                        String cEnd = other.getEndTime().toString().substring(0, 5);
                        return new ResponseDTO(false,
                                "Time Slot Conflict: The updated time (" + booking.getStartTime().toString().substring(0, 5) + " - " + booking.getEndTime().toString().substring(0, 5) +
                                ") on " + booking.getEventDate() + " overlaps with an existing booking #EVT-" + other.getId() + " (" + cStart + " - " + cEnd + ").", null);
                    }
                }
            }
        }

        if (dto.getCustomRequirements() != null) {
            booking.setCustomRequirements(dto.getCustomRequirements().trim());
        }
        if (dto.getTotalAmount() != null) {
            if (dto.getTotalAmount() < 0) {
                return new ResponseDTO(false, "Total amount / advance cannot be negative.", null);
            }
            booking.setTotalAmount(dto.getTotalAmount());
        }
        if (dto.getBalanceAmount() != null) {
            if (dto.getBalanceAmount() < 0) {
                return new ResponseDTO(false, "Remaining balance amount cannot be negative.", null);
            }
            booking.setBalanceAmount(dto.getBalanceAmount());
        }

        // Update Payment Method
        if (dto.getPaymentMethodId() != null || (dto.getPaymentMethod() != null && !dto.getPaymentMethod().trim().isEmpty())) {
            PaymentMethodEntity resolvedPayment = resolvePaymentMethod(dto.getPaymentMethodId(), dto.getPaymentMethod());
            if (resolvedPayment != null) {
                booking.setPaymentMethod(resolvedPayment);
            }
        }

        EventBookingEntity saved = eventBookingRepository.save(booking);
        return new ResponseDTO(true, "Booking updated successfully!", convertToDTO(saved));
    }

    @Override
    public ResponseDTO getBookingStatistics() {
        List<EventBookingEntity> all = eventBookingRepository.findAll();
        long total = all.size();
        long pending = all.stream().filter(b -> b.getBookingStatus() != null && "PENDING".equalsIgnoreCase(b.getBookingStatus().getBookingStatus())).count();
        long confirmed = all.stream().filter(b -> b.getBookingStatus() != null && "CONFIRMED".equalsIgnoreCase(b.getBookingStatus().getBookingStatus())).count();
        long cancelled = all.stream().filter(b -> b.getBookingStatus() != null && "CANCELLED".equalsIgnoreCase(b.getBookingStatus().getBookingStatus())).count();

        BookingStatsDTO stats = new BookingStatsDTO(total, pending, confirmed, cancelled);
        return new ResponseDTO(true, "Booking statistics calculated.", stats);
    }

    @Override
    public ResponseDTO getAllBookingStatuses() {
        List<BookingStatusEntity> statuses = bookingStatusRepository.findAll();
        return new ResponseDTO(true, "Booking statuses loaded.", statuses);
    }

    @Override
    public ResponseDTO getAllPaymentMethods() {
        List<PaymentMethodEntity> methods = paymentMethodRepository.findAll();
        return new ResponseDTO(true, "Payment methods loaded.", methods);
    }

    private BookingResponseDTO convertToDTO(EventBookingEntity entity) {
        BookingResponseDTO dto = modelMapper.map(entity, BookingResponseDTO.class);
        if (entity.getCustomer() != null) {
            dto.setCustomerId(entity.getCustomer().getId());
            dto.setCustomerName(entity.getCustomer().getFirstName() + " " + entity.getCustomer().getLastName());
            dto.setCustomerEmail(entity.getCustomer().getEmail());
            dto.setCustomerMobile(entity.getCustomer().getMobile());
        }
        if (entity.getPackageEntity() != null) {
            dto.setPackageId(entity.getPackageEntity().getId());
            dto.setPackageTitle(entity.getPackageEntity().getTitle());
        } else {
            dto.setPackageTitle("Custom Requirement Event");
        }
        if (entity.getPaymentMethod() != null) {
            dto.setPaymentMethodId(entity.getPaymentMethod().getId());
            dto.setPaymentMethod(entity.getPaymentMethod().getPaymentMethod());
        }
        if (entity.getBookingStatus() != null) {
            dto.setBookingStatusId(entity.getBookingStatus().getId());
            dto.setBookingStatus(entity.getBookingStatus().getBookingStatus());
        }
        dto.setTotalAmount(entity.getTotalAmount() != null ? entity.getTotalAmount() : 0.0);
        dto.setBalanceAmount(entity.getBalanceAmount() != null ? entity.getBalanceAmount() : 0.0);
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private BookingStatusEntity resolveBookingStatus(Integer statusId, String statusName) {
        if (statusId != null) {
            Optional<BookingStatusEntity> byId = bookingStatusRepository.findById(statusId);
            if (byId.isPresent()) return byId.get();
        }

        if (statusName != null && !statusName.trim().isEmpty()) {
            String trimmed = statusName.trim();
            Optional<BookingStatusEntity> exact = bookingStatusRepository.findByBookingStatusIgnoreCase(trimmed);
            if (exact.isPresent()) return exact.get();

            String cleanQuery = trimmed.toUpperCase().replaceAll("[^A-Z0-9]", "");
            List<BookingStatusEntity> all = bookingStatusRepository.findAll();
            for (BookingStatusEntity s : all) {
                String clean = (s.getBookingStatus() != null ? s.getBookingStatus() : "").toUpperCase().replaceAll("[^A-Z0-9]", "");
                if (clean.equals(cleanQuery) || clean.contains(cleanQuery) || cleanQuery.contains(clean)) {
                    return s;
                }
            }

            // Create if not found
            BookingStatusEntity newStatus = new BookingStatusEntity();
            newStatus.setBookingStatus(trimmed);
            return bookingStatusRepository.save(newStatus);
        }

        return bookingStatusRepository.findByBookingStatusIgnoreCase("Pending")
                .orElseGet(() -> bookingStatusRepository.findAll().stream().findFirst().orElse(null));
    }

    private PaymentMethodEntity resolvePaymentMethod(Integer paymentMethodId, String methodName) {
        if (paymentMethodId != null) {
            Optional<PaymentMethodEntity> byId = paymentMethodRepository.findById(paymentMethodId);
            if (byId.isPresent()) return byId.get();
        }

        if (methodName != null && !methodName.trim().isEmpty()) {
            String trimmed = methodName.trim();
            Optional<PaymentMethodEntity> exact = paymentMethodRepository.findByPaymentMethodIgnoreCase(trimmed);
            if (exact.isPresent()) return exact.get();

            String cleanQuery = trimmed.toUpperCase().replaceAll("[^A-Z0-9]", "");
            List<PaymentMethodEntity> all = paymentMethodRepository.findAll();
            for (PaymentMethodEntity m : all) {
                String clean = (m.getPaymentMethod() != null ? m.getPaymentMethod() : "").toUpperCase().replaceAll("[^A-Z0-9]", "");
                if (clean.equals(cleanQuery) || clean.contains(cleanQuery) || cleanQuery.contains(clean)) {
                    return m;
                }
            }

            // Create if not found
            PaymentMethodEntity newMethod = new PaymentMethodEntity();
            newMethod.setPaymentMethod(trimmed);
            return paymentMethodRepository.save(newMethod);
        }

        return paymentMethodRepository.findByPaymentMethodIgnoreCase("Cash on Event Date")
                .orElseGet(() -> paymentMethodRepository.findAll().stream().findFirst().orElse(null));
    }
}
