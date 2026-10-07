package com.event.snappro.SnapPro.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "event_bookings")
public class EventBookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    private PackageEntity packageEntity;

    @Column(name = "event_title", nullable = false, length = 150)
    private String eventTitle;

    @Column(name = "event_location", nullable = false, length = 255)
    private String eventLocation;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "custom_requirements", columnDefinition = "TEXT")
    private String customRequirements;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount = 0.0;

    @Column(name = "balance_amount")
    private Double balanceAmount = 0.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_method_id", nullable = false)
    private PaymentMethodEntity paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_status_id", nullable = false)
    private BookingStatusEntity bookingStatus;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
