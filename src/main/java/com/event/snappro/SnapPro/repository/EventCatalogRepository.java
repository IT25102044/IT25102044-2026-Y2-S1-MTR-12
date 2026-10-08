package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.EventCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventCatalogRepository extends JpaRepository<EventCatalog, Integer> {

    List<EventCatalog> findByBookingId(Integer bookingId);

    boolean existsByBookingId(Integer bookingId);

}
