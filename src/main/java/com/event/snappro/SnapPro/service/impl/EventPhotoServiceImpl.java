package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.EventPhotoResponseDTO;
import com.event.snappro.SnapPro.dto.EventPhotoUpdateDTO;
import com.event.snappro.SnapPro.entity.EventCatalog;
import com.event.snappro.SnapPro.entity.EventPhoto;
import com.event.snappro.SnapPro.repository.EventPhotoRepository;
import com.event.snappro.SnapPro.service.EventPhotoService;
import com.event.snappro.SnapPro.service.PhotographerProfileService;
import com.event.snappro.SnapPro.repository.EventCatalogRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class EventPhotoServiceImpl implements EventPhotoService {

        private final EventPhotoRepository eventPhotoRepository;
        private final EventCatalogRepository eventCatalogRepository;
        private final PhotographerProfileService photographerProfileService;

        @Value("${app.upload.dir:uploads/event-photos}")
        private String uploadDirectory;

        public EventPhotoServiceImpl(
                        EventPhotoRepository eventPhotoRepository,
                        EventCatalogRepository eventCatalogRepository,
                        PhotographerProfileService photographerProfileService) {
                this.eventPhotoRepository = eventPhotoRepository;
                this.eventCatalogRepository = eventCatalogRepository;
                this.photographerProfileService = photographerProfileService;
        }

        // =====================================================
        // SEP-02 - UPLOAD PHOTO FOR A CATALOG
        // =====================================================

        @Override
        @Transactional
        public EventPhotoResponseDTO uploadPhoto(
                        String authenticatedEmail,
                        Integer catalogId,
                        MultipartFile file,
                        String title,
                        String description) {

                if (catalogId == null) {
                        throw new IllegalArgumentException("Catalog ID is required for photo upload.");
                }

                EventCatalog catalog = eventCatalogRepository.findById(catalogId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Catalog not found with ID: " + catalogId));

                Integer photographerProfileId = photographerProfileService
                                .getOrCreateProfileId(authenticatedEmail);

                // 1. Check whether a file was selected
                if (file == null || file.isEmpty()) {
                        throw new IllegalArgumentException(
                                        "Please select a photo to upload.");
                }

                // 2. Check file type
                String contentType = file.getContentType();

                if (!"image/jpeg".equals(contentType)
                                && !"image/png".equals(contentType)) {

                        throw new IllegalArgumentException(
                                        "Only JPG, JPEG and PNG photos are allowed.");
                }

                // Verify file signature (the browser-provided Content-Type is not trusted).
                try (var input = file.getInputStream()) {
                        byte[] signature = input.readNBytes(8);
                        boolean jpeg = signature.length >= 3
                                && (signature[0] & 0xff) == 0xff
                                && (signature[1] & 0xff) == 0xd8
                                && (signature[2] & 0xff) == 0xff;
                        boolean png = signature.length >= 8
                                && (signature[0] & 0xff) == 0x89
                                && signature[1] == 'P' && signature[2] == 'N' && signature[3] == 'G'
                                && (signature[4] & 0xff) == 13 && (signature[5] & 0xff) == 10
                                && (signature[6] & 0xff) == 26 && (signature[7] & 0xff) == 10;
                        if (("image/jpeg".equals(contentType) && !jpeg)
                                || ("image/png".equals(contentType) && !png)) {
                                throw new IllegalArgumentException("File content does not match JPEG/PNG format.");
                        }
                } catch (IOException e) {
                        throw new IllegalArgumentException("Unable to inspect uploaded photo.");
                }

                // 3. Check maximum size - 10 MB
                long maxFileSize = 10L * 1024 * 1024;

                if (file.getSize() > maxFileSize) {
                        throw new IllegalArgumentException(
                                        "Photo size must not exceed 10 MB.");
                }

                // 4. Get original filename
                String originalFileName = StringUtils.cleanPath(
                                file.getOriginalFilename() == null ? "photo" : file.getOriginalFilename())
                                .replace('\\', '/');
                originalFileName = originalFileName.substring(originalFileName.lastIndexOf('/') + 1);
                if (originalFileName.isBlank()) originalFileName = "photo";

                // 5. Get extension
                String extension = "";

                int dotIndex = originalFileName.lastIndexOf('.');

                if (dotIndex >= 0) {
                        extension = originalFileName.substring(dotIndex);
                }

                // 6. Create a unique filename
                String storedFileName = UUID.randomUUID() + ("image/png".equals(contentType) ? ".png" : ".jpg");

                try {

                        // 7. Create upload directory if it does not exist
                        Path uploadPath = Paths.get(uploadDirectory)
                                        .toAbsolutePath()
                                        .normalize();

                        Files.createDirectories(uploadPath);

                        // 8. Create final file location
                        Path targetPath = uploadPath.resolve(storedFileName);

                        // 9. Save physical image
                        Files.copy(
                                        file.getInputStream(),
                                        targetPath,
                                        StandardCopyOption.REPLACE_EXISTING);

                        // 10. Create database entity
                        EventPhoto eventPhoto = new EventPhoto();

                        eventPhoto.setCatalogId(catalogId);
                        eventPhoto.setBookingId(catalog.getBookingId());
                        eventPhoto.setUploadedBy(photographerProfileId);

                        eventPhoto.setFileName(originalFileName);

                        // Save relative location in database
                        eventPhoto.setFilePath(
                                        "uploads/event-photos/" + storedFileName);

                        eventPhoto.setTitle(title);
                        eventPhoto.setDescription(description);

                        eventPhoto.setFileType(contentType);

                        long fileSizeKb = (file.getSize() + 1023) / 1024;

                        eventPhoto.setFileSizeKb(fileSizeKb);

                        eventPhoto.setDeleted(false);

                        // 11. Save photo details to database
                        EventPhoto savedPhoto = eventPhotoRepository.save(eventPhoto);

                        // 12. Convert Entity to DTO
                        return convertToResponseDTO(savedPhoto);

                } catch (IOException e) {

                        throw new RuntimeException(
                                        "Could not save the uploaded photo.",
                                        e);
                }
        }

        // =====================================================
        // GET ALL ACTIVE PHOTOS
        // =====================================================

        @Override
        public List<EventPhotoResponseDTO> getAllPhotos() {

                return eventPhotoRepository
                                .findByDeletedFalse()
                                .stream()
                                .map(this::convertToResponseDTO)
                                .toList();
        }

        // =====================================================
        // GET ACTIVE PHOTOS BY CATALOG ID
        // =====================================================

        @Override
        public List<EventPhotoResponseDTO> getPhotosByCatalog(Integer catalogId) {

                return eventPhotoRepository
                                .findByCatalogIdAndDeletedFalse(catalogId)
                                .stream()
                                .map(this::convertToResponseDTO)
                                .toList();
        }

        // =====================================================
        // SEP-01 - GET PHOTOS BY EVENT / BOOKING
        // =====================================================

        @Override
        public List<EventPhotoResponseDTO> getPhotosByBooking(
                        Integer bookingId) {

                return eventPhotoRepository
                                .findByBookingIdAndDeletedFalse(bookingId)
                                .stream()
                                .map(this::convertToResponseDTO)
                                .toList();
        }

        // =====================================================
        // GET ONE PHOTO
        // =====================================================

        @Override
        public EventPhotoResponseDTO getPhotoById(Integer id) {

                EventPhoto photo = findActivePhoto(id);

                return convertToResponseDTO(photo);
        }

        // =====================================================
        // SEP-05 - UPDATE PHOTO DETAILS
        // =====================================================

        @Override
        @Transactional
        public EventPhotoResponseDTO updatePhoto(
                        Integer id,
                        EventPhotoUpdateDTO updateDTO) {

                EventPhoto photo = findActivePhoto(id);

                photo.setTitle(updateDTO.getTitle());
                photo.setDescription(updateDTO.getDescription());

                EventPhoto updatedPhoto = eventPhotoRepository.save(photo);

                return convertToResponseDTO(updatedPhoto);
        }

        // =====================================================
        // SEP-06 - SOFT DELETE INDIVIDUAL PHOTO
        // Preserves row in event_photos table (is_deleted = 1)
        // =====================================================

        @Override
        @Transactional
        public void deletePhoto(Integer id) {

                EventPhoto photo = findActivePhoto(id);

                // Soft delete inside catalog: row stays in event_photos
                photo.setDeleted(true);

                eventPhotoRepository.save(photo);
        }

        // =====================================================
        // HELPER - FIND ACTIVE PHOTO
        // =====================================================

        private EventPhoto findActivePhoto(Integer id) {

                EventPhoto photo = eventPhotoRepository
                                .findById(id)
                                .orElseThrow(
                                                () -> new RuntimeException(
                                                                "Photo not found with ID: " + id));

                if (Boolean.TRUE.equals(photo.getDeleted())) {

                        throw new RuntimeException(
                                        "Photo not found with ID: " + id);
                }

                return photo;
        }

        // =====================================================
        // HELPER - ENTITY TO DTO
        // =====================================================

        private EventPhotoResponseDTO convertToResponseDTO(
                        EventPhoto photo) {

                EventPhotoResponseDTO dto = new EventPhotoResponseDTO();

                dto.setId(photo.getId());

                dto.setCatalogId(photo.getCatalogId());

                dto.setBookingId(photo.getBookingId());

                dto.setFileName(photo.getFileName());

                dto.setFilePath(photo.getFilePath());

                dto.setTitle(photo.getTitle());

                dto.setDescription(photo.getDescription());

                dto.setFileType(photo.getFileType());

                dto.setFileSizeKb(photo.getFileSizeKb());

                dto.setUploadedAt(photo.getUploadedAt());

                dto.setUpdatedAt(photo.getUpdatedAt());

                return dto;
        }
}