package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.dto.PhotographerProfileResponseDTO;
import com.event.snappro.SnapPro.dto.PhotographerProfileUpdateDTO;

public interface PhotographerProfileService {
    PhotographerProfileResponseDTO getProfile(String email);
    Integer getOrCreateProfileId(String email);
    PhotographerProfileResponseDTO updateProfile(String email, PhotographerProfileUpdateDTO updateDTO);
    // Password changes are deliberately excluded: existing group login compares plain text.
}
