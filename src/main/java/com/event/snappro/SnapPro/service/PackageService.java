package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.dto.ResponseDTO;

public interface PackageService {
    ResponseDTO getAllActivePackages();
    ResponseDTO getAllPackages();
    ResponseDTO getPackageById(Integer id);
}
