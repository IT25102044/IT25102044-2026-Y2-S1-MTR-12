package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.PackageDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.entity.PackageEntity;
import com.event.snappro.SnapPro.repository.PackageRepository;
import com.event.snappro.SnapPro.service.PackageService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PackageServiceImpl implements PackageService {

    private final PackageRepository packageRepository;
    private final ModelMapper modelMapper;

    @Override
    public ResponseDTO getAllActivePackages() {
        List<PackageEntity> packages = packageRepository.findByPackageStatus_StatusIgnoreCase("ACTIVE");
        
        // If no specifically marked "ACTIVE" status exists, fetch all packages
        if (packages.isEmpty()) {
            packages = packageRepository.findAll();
        }

        List<PackageDTO> dtoList = packages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new ResponseDTO(true, "Active packages retrieved successfully.", dtoList);
    }

    @Override
    public ResponseDTO getAllPackages() {
        List<PackageEntity> packages = packageRepository.findAll();
        List<PackageDTO> dtoList = packages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new ResponseDTO(true, "All packages retrieved successfully.", dtoList);
    }

    @Override
    public ResponseDTO getPackageById(Integer id) {
        Optional<PackageEntity> packageOptional = packageRepository.findById(id);
        if (packageOptional.isEmpty()) {
            return new ResponseDTO(false, "Package not found with ID: " + id, null);
        }

        PackageDTO dto = convertToDTO(packageOptional.get());
        return new ResponseDTO(true, "Package found.", dto);
    }

    private PackageDTO convertToDTO(PackageEntity pkg) {
        PackageDTO dto = modelMapper.map(pkg, PackageDTO.class);
        if (pkg.getPackageStatus() != null) {
            dto.setStatus(pkg.getPackageStatus().getStatus());
        }
        if (pkg.getCreatedBy() != null) {
            dto.setCreatedById(pkg.getCreatedBy().getId());
            dto.setCreatedByName(pkg.getCreatedBy().getFirstName() + " " + pkg.getCreatedBy().getLastName());
        }
        return dto;
    }
}
