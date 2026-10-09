package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.BookedSlotDTO;
import com.event.snappro.SnapPro.dto.BookingRequestDTO;
import com.event.snappro.SnapPro.dto.BookingResponseDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.entity.*;
import com.event.snappro.SnapPro.repository.*;
import com.event.snappro.SnapPro.service.BookingService;
import com.event.snappro.SnapPro.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final EventBookingRepository eventBookingRepository;
    private final UserRepository userRepository;
    private final PackageRepository packageRepository;
    private final BookingStatusRepository bookingStatusRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final EmailService emailService;
    private final org.modelmapper.ModelMapper modelMapper;

    @Override
    public ResponseDTO createBooking(BookingRequestDTO requestDTO, HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return new ResponseDTO(false, "Please sign in to submit a booking request.", null);
        }

        Integer userId = (Integer) session.getAttribute("userId");
        Optional<UserEntity> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            return new ResponseDTO(false, "Customer account not found.", null);
        }

        if (requestDTO == null) {
            return new ResponseDTO(false, "Invalid booking request data.", null);
        }

        String eventTitle = requestDTO.getEventTitle() != null ? requestDTO.getEventTitle().trim() : "";
        String eventLocation = requestDTO.getEventLocation() != null ? requestDTO.getEventLocation().trim() : "";
        LocalDate eventDate = requestDTO.getEventDate();
        var startTime = requestDTO.getStartTime();
        var endTime = requestDTO.getEndTime();
        String customReqs = requestDTO.getCustomRequirements() != null ? requestDTO.getCustomRequirements().trim() : "";

        // Core field validation
        if (eventTitle.isEmpty()) {
            return new ResponseDTO(false, "Please provide an event title.", null);
        }
        if (eventLocation.isEmpty()) {
            return new ResponseDTO(false, "Please provide an event location address.", null);
        }
        if (eventDate == null) {
            return new ResponseDTO(false, "Please select an event date.", null);
        }
        if (eventDate.isBefore(LocalDate.now())) {
            return new ResponseDTO(false, "Booking date cannot be in the past.", null);
        }
        if (startTime == null || endTime == null) {
            return new ResponseDTO(false, "Please specify both start time and end time.", null);
        }
        if (!endTime.isAfter(startTime)) {
            return new ResponseDTO(false, "Event end time must be after start time.", null);
        }

        // Date & Time slot overlap validation against existing active bookings
        List<EventBookingEntity> existingBookingsOnDate = eventBookingRepository.findActiveBookingsByDate(eventDate);
        for (EventBookingEntity existing : existingBookingsOnDate) {
            if (existing.getStartTime() != null && existing.getEndTime() != null) {
                // Overlap condition: (newStart < existingEnd) && (newEnd > existingStart)
                if (startTime.isBefore(existing.getEndTime()) && endTime.isAfter(existing.getStartTime())) {
                    String conflictStart = existing.getStartTime().toString().substring(0, 5);
                    String conflictEnd = existing.getEndTime().toString().substring(0, 5);
                    String requestedStart = startTime.toString().substring(0, 5);
                    String requestedEnd = endTime.toString().substring(0, 5);
                    return new ResponseDTO(false,
                            "Time Slot Conflict: The selected time (" + requestedStart + " - " + requestedEnd +
                            ") on " + eventDate + " overlaps with an already booked slot (" + conflictStart + " - " + conflictEnd +
                            "). Please choose an available time slot.", null);
                }
            }
        }

        UserEntity customer = userOptional.get();

        // 1. Package association, custom requirement validation & amount calculation
        PackageEntity packageEntity = null;
        Double totalAmount = 0.0;

        if (requestDTO.getPackageId() != null) {
            // Standard Package Booking
            Optional<PackageEntity> pkgOpt = packageRepository.findById(requestDTO.getPackageId());
            if (pkgOpt.isEmpty()) {
                return new ResponseDTO(false, "Selected photography package not found.", null);
            }
            packageEntity = pkgOpt.get();
            totalAmount = packageEntity.getPrice() != null ? packageEntity.getPrice() : 0.0;
        } else {
            // Custom Requirement Event Booking (Advance LKR 3000)
            if (customReqs.isEmpty()) {
                return new ResponseDTO(false, "Please enter your event details in the Custom Requirements field before submitting.", null);
            }
            packageEntity = null; // Saved without a package_id
            totalAmount = 3000.0; // Advance LKR 3000
        }

        // 2. Fetch or create "Pending" status
        BookingStatusEntity bookingStatus = bookingStatusRepository.findByBookingStatusIgnoreCase("Pending")
                .orElseGet(() -> {
                    List<BookingStatusEntity> allStatuses = bookingStatusRepository.findAll();
                    if (!allStatuses.isEmpty()) {
                        return allStatuses.get(0);
                    }
                    BookingStatusEntity newStatus = new BookingStatusEntity();
                    newStatus.setBookingStatus("Pending");
                    return bookingStatusRepository.save(newStatus);
                });

        // 3. Fetch or create Payment Method (default: Cash on Event Date)
        PaymentMethodEntity paymentMethod = null;
        if (requestDTO.getPaymentMethodId() != null) {
            paymentMethod = paymentMethodRepository.findById(requestDTO.getPaymentMethodId()).orElse(null);
        }
        if (paymentMethod == null) {
            paymentMethod = paymentMethodRepository.findByPaymentMethodIgnoreCase("Cash on Event Date")
                    .orElseGet(() -> {
                        List<PaymentMethodEntity> allMethods = paymentMethodRepository.findAll();
                        if (!allMethods.isEmpty()) {
                            return allMethods.get(0);
                        }
                        PaymentMethodEntity newMethod = new PaymentMethodEntity();
                        newMethod.setPaymentMethod("Cash on Event Date");
                        return paymentMethodRepository.save(newMethod);
                    });
        }

        // 4. Create and save entity
        EventBookingEntity bookingEntity = new EventBookingEntity();
        bookingEntity.setCustomer(customer);
        bookingEntity.setPackageEntity(packageEntity);
        bookingEntity.setEventTitle(requestDTO.getEventTitle().trim());
        bookingEntity.setEventLocation(requestDTO.getEventLocation().trim());
        bookingEntity.setEventDate(requestDTO.getEventDate());
        bookingEntity.setStartTime(requestDTO.getStartTime());
        bookingEntity.setEndTime(requestDTO.getEndTime());
        bookingEntity.setCustomRequirements(requestDTO.getCustomRequirements());
        bookingEntity.setTotalAmount(totalAmount);
        bookingEntity.setPaymentMethod(paymentMethod);
        bookingEntity.setBookingStatus(bookingStatus);
        bookingEntity.setCreatedAt(LocalDateTime.now());

        EventBookingEntity saved = eventBookingRepository.save(bookingEntity);
        BookingResponseDTO responseDTO = convertToDTO(saved);

        // Dispatch asynchronous booking confirmation email to customer
        String fullName = (customer.getFirstName() != null ? customer.getFirstName() : "") + " " +
                (customer.getLastName() != null ? customer.getLastName() : "");
        emailService.sendBookingConfirmationEmail(customer.getEmail(), fullName.trim(), saved);

        return new ResponseDTO(true, "Booking request submitted successfully with status 'Pending'!", responseDTO);
    }

    @Override
    public ResponseDTO getCustomerBookings(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return new ResponseDTO(false, "Unauthorized", null);
        }

        Integer userId = (Integer) session.getAttribute("userId");
        List<EventBookingEntity> bookings = eventBookingRepository.findByCustomer_IdOrderByCreatedAtDesc(userId);

        List<BookingResponseDTO> dtoList = bookings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new ResponseDTO(true, "Bookings retrieved successfully.", dtoList);
    }

    @Override
    public ResponseDTO getBookedSlots(LocalDate date) {
        List<EventBookingEntity> bookings;
        if (date != null) {
            bookings = eventBookingRepository.findActiveBookingsByDate(date);
        } else {
            bookings = eventBookingRepository.findUpcomingActiveBookings(LocalDate.now());
        }

        List<BookedSlotDTO> slots = bookings.stream().map(b -> new BookedSlotDTO(
                b.getId(),
                b.getEventDate(),
                b.getStartTime(),
                b.getEndTime(),
                b.getBookingStatus() != null ? b.getBookingStatus().getBookingStatus() : "Confirmed",
                b.getEventTitle() != null ? b.getEventTitle() : "Booked Shoot"
        )).collect(Collectors.toList());

        return new ResponseDTO(true, "Booked time slots retrieved successfully.", slots);
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
        return dto;
    }
}
