package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.EventCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventCatalogRepository extends JpaRepository<EventCatalog, Integer> {

    List<EventCatalog> findByBookingId(Integer bookingId);

    boolean existsByBookingId(Integer bookingId);

    // Set the timestamp explicitly, including when saving unchanged values.
    // Clearing the persistence context ensures the next read sees the new timestamp.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "UPDATE event_catalog SET catalog_name = :name, description = :description, " +
            "updated_at = CURRENT_TIMESTAMP WHERE id = :id", nativeQuery = true)
    int updateAlbumDetails(@Param("id") Integer id,
                           @Param("name") String name,
                           @Param("description") String description);

}
