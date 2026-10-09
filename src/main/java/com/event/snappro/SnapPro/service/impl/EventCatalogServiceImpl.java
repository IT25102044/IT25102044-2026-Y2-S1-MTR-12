package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.CatalogRequestDTO;
import com.event.snappro.SnapPro.dto.CatalogResponseDTO;
import com.event.snappro.SnapPro.dto.CatalogUpdateDTO;
import com.event.snappro.SnapPro.entity.EventCatalog;
import com.event.snappro.SnapPro.entity.EventPhoto;
import com.event.snappro.SnapPro.repository.EventBookingRepository;
import com.event.snappro.SnapPro.repository.EventPhotoRepository;
import com.event.snappro.SnapPro.service.EventCatalogService;
import com.event.snappro.SnapPro.repository.EventCatalogRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class EventCatalogServiceImpl implements EventCatalogService {

    private final EventCatalogRepository eventCatalogRepository;
    private final EventPhotoRepository eventPhotoRepository;
    private final EventBookingRepository bookingRepository;

    public EventCatalogServiceImpl(
            EventCatalogRepository eventCatalogRepository,
            EventPhotoRepository eventPhotoRepository,
            EventBookingRepository bookingRepository) {
        this.eventCatalogRepository = eventCatalogRepository;
        this.eventPhotoRepository = eventPhotoRepository;
        this.bookingRepository = bookingRepository;
    }

    // =====================================================
    // CREATE CATALOG MANUALLY
    // =====================================================

    @Override
    @Transactional
    public CatalogResponseDTO createCatalog(CatalogRequestDTO request) {

        if (request.getCatalogName() == null || request.getCatalogName().trim().isEmpty()) {
            throw new IllegalArgumentException("Catalog name is required.");
        }

        if (request.getBookingId() == null) {
            throw new IllegalArgumentException("Event/Booking selection is required.");
        }

        var booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking does not exist."));
        if (booking.getBookingStatus() == null || booking.getBookingStatus().getBookingStatus() == null
                || !"COMPLETED".equalsIgnoreCase(booking.getBookingStatus().getBookingStatus().trim())) {
            throw new IllegalArgumentException("Albums can only be created for completed bookings.");
        }

        if (eventCatalogRepository.existsByBookingId(request.getBookingId())) {
            throw new IllegalArgumentException("This event already has an album.");
        }

        EventCatalog catalog = new EventCatalog();

        catalog.setBookingId(request.getBookingId());
        catalog.setCatalogName(request.getCatalogName().trim());
        catalog.setDescription(request.getDescription());

        EventCatalog savedCatalog = eventCatalogRepository.save(catalog);

        return convertToResponseDTO(savedCatalog);
    }

    // =====================================================
    // GET ALL CATALOGS
    // =====================================================

    @Override
    public List<CatalogResponseDTO> getAllCatalogs() {

        return eventCatalogRepository.findAll()
                .stream()
                .map(this::convertToResponseDTO)
                .toList();
    }

    // =====================================================
    // GET CATALOGS BY BOOKING / EVENT
    // =====================================================

    @Override
    public List<CatalogResponseDTO> getCatalogsByBooking(Integer bookingId) {

        return eventCatalogRepository.findByBookingId(bookingId)
                .stream()
                .map(this::convertToResponseDTO)
                .toList();
    }

    // =====================================================
    // GET CATALOG BY ID
    // =====================================================

    @Override
    public CatalogResponseDTO getCatalogById(Integer id) {

        EventCatalog catalog = eventCatalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catalog not found with ID: " + id));

        return convertToResponseDTO(catalog);
    }

    // =====================================================
    // EDIT EXISTING ALBUM (NAME AND DESCRIPTION ONLY)
    // =====================================================

    @Override
    @Transactional
    public CatalogResponseDTO updateCatalog(Integer id, CatalogUpdateDTO request) {
        if (id == null || !eventCatalogRepository.existsById(id)) {
            throw new NoSuchElementException("Album not found.");
        }

        String name = request.getCatalogName() == null ? "" : request.getCatalogName().trim();
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Album name is required.");
        }
        if (name.length() > 150) {
            throw new IllegalArgumentException("Album name must be 150 characters or fewer.");
        }

        String description = request.getDescription() == null ? "" : request.getDescription().trim();

        eventCatalogRepository.updateAlbumDetails(id, name, description);

        // Reload so updatedAt in the API response reflects the database timestamp.
        EventCatalog updated = eventCatalogRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Album not found."));
        return convertToResponseDTO(updated);
    }

    // =====================================================
    // DELETE CATALOG (HARD CASCADE DELETE OF CATALOG + PHOTOS)
    // =====================================================

    @Override
    @Transactional
    public void deleteCatalog(Integer id) {

        EventCatalog catalog = eventCatalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catalog not found with ID: " + id));

        // 1. Find all photos belonging to this catalog (both active and soft-deleted)
        List<EventPhoto> photos = eventPhotoRepository.findByCatalogId(id);

        // 2. Delete physical image files from disk
        for (EventPhoto photo : photos) {
            try {
                if (photo.getFilePath() != null) {
                    Path root = Paths.get("uploads/event-photos").toAbsolutePath().normalize();
                    Path filePath = Paths.get(photo.getFilePath()).toAbsolutePath().normalize();
                    if (filePath.startsWith(root)) Files.deleteIfExists(filePath);
                }
            } catch (Exception e) {
                // Ignore if physical file was already removed
            }
        }

        // 3. Hard-delete all matching photo records from event_photos table
        if (!photos.isEmpty()) {
            eventPhotoRepository.deleteAll(photos);
        }

        // 4. Hard-delete the catalog record from event_catalog table
        eventCatalogRepository.delete(catalog);
    }

    // =====================================================
    // HELPER - ENTITY TO DTO
    // =====================================================

    private CatalogResponseDTO convertToResponseDTO(EventCatalog catalog) {

        CatalogResponseDTO dto = new CatalogResponseDTO();

        dto.setId(catalog.getId());
        dto.setBookingId(catalog.getBookingId());
        dto.setCatalogName(catalog.getCatalogName());
        dto.setDescription(catalog.getDescription());
        dto.setCreatedAt(catalog.getCreatedAt());
        dto.setUpdatedAt(catalog.getUpdatedAt());

        long count = eventPhotoRepository.countByCatalogIdAndDeletedFalse(catalog.getId());
        dto.setPhotoCount((int) count);

        return dto;
    }
}
