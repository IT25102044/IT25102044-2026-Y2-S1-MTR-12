package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.dto.EventPhotoResponseDTO;
import com.event.snappro.SnapPro.dto.EventPhotoUpdateDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EventPhotoService {

        // SEP-02 - Upload a photo for a catalog
        EventPhotoResponseDTO uploadPhoto(
                        String authenticatedEmail,
                        Integer catalogId,
                        MultipartFile file,
                        String title,
                        String description);

        // Get all active photos
        List<EventPhotoResponseDTO> getAllPhotos();

        // Get photos belonging to a catalog
        List<EventPhotoResponseDTO> getPhotosByCatalog(Integer catalogId);

        // SEP-01 - Get photos belonging to a selected event
        List<EventPhotoResponseDTO> getPhotosByBooking(Integer bookingId);

        // Get one photo
        EventPhotoResponseDTO getPhotoById(Integer id);

        // SEP-05 - Edit photo information
        EventPhotoResponseDTO updatePhoto(
                        Integer id,
                        EventPhotoUpdateDTO updateDTO);

        // SEP-06 - Soft delete individual photo inside catalog (preserves row in
        // event_photos)
        void deletePhoto(Integer id);
}