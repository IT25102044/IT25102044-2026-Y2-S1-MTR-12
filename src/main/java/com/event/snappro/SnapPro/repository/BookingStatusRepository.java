package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.BookingStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingStatusRepository extends JpaRepository<BookingStatusEntity, Integer> {
    Optional<BookingStatusEntity> findByBookingStatusIgnoreCase(String bookingStatus);
}
