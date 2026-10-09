package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.EventPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventPhotoRepository
        extends JpaRepository<EventPhoto, Integer> {

    List<EventPhoto> findByDeletedFalse();

    List<EventPhoto> findByBookingIdAndDeletedFalse(Integer bookingId);

    List<EventPhoto> findByCatalogIdAndDeletedFalse(Integer catalogId);

    List<EventPhoto> findByCatalogId(Integer catalogId);

    long countByCatalogIdAndDeletedFalse(Integer catalogId);
}