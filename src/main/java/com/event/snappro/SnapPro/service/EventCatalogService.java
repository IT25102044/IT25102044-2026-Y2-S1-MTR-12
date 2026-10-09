package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.dto.CatalogRequestDTO;
import com.event.snappro.SnapPro.dto.CatalogResponseDTO;
import com.event.snappro.SnapPro.dto.CatalogUpdateDTO;

import java.util.List;

public interface EventCatalogService {

    CatalogResponseDTO createCatalog(CatalogRequestDTO request);

    List<CatalogResponseDTO> getAllCatalogs();

    List<CatalogResponseDTO> getCatalogsByBooking(Integer bookingId);

    CatalogResponseDTO getCatalogById(Integer id);

    CatalogResponseDTO updateCatalog(Integer id, CatalogUpdateDTO request);

    void deleteCatalog(Integer id);
}
