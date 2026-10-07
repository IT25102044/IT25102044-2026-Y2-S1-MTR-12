package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.EventBookingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventBookingRepository extends JpaRepository<EventBookingEntity, Integer> {
    List<EventBookingEntity> findByCustomer_IdOrderByCreatedAtDesc(Integer customerId);
    List<EventBookingEntity> findAllByOrderByCreatedAtDesc();
}
