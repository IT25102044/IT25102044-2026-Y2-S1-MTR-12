package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.EventBookingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventBookingRepository extends JpaRepository<EventBookingEntity, Integer> {
    List<EventBookingEntity> findByCustomer_IdOrderByCreatedAtDesc(Integer customerId);
    List<EventBookingEntity> findAllByOrderByCreatedAtDesc();

    @Query("SELECT b FROM EventBookingEntity b WHERE b.eventDate = :eventDate AND (b.bookingStatus IS NULL OR LOWER(b.bookingStatus.bookingStatus) != 'cancelled') ORDER BY b.startTime ASC")
    List<EventBookingEntity> findActiveBookingsByDate(@Param("eventDate") LocalDate eventDate);

    @Query("SELECT b FROM EventBookingEntity b WHERE b.eventDate >= :fromDate AND (b.bookingStatus IS NULL OR LOWER(b.bookingStatus.bookingStatus) != 'cancelled') ORDER BY b.eventDate ASC, b.startTime ASC")
    List<EventBookingEntity> findUpcomingActiveBookings(@Param("fromDate") LocalDate fromDate);
}
