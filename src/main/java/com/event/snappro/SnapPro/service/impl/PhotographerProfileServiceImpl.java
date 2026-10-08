package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.PhotographerProfileResponseDTO;
import com.event.snappro.SnapPro.dto.PhotographerProfileUpdateDTO;
import com.event.snappro.SnapPro.entity.PhotographerProfile;
import com.event.snappro.SnapPro.entity.UserEntity;
import com.event.snappro.SnapPro.repository.PhotographerProfileRepository;
import com.event.snappro.SnapPro.repository.UserRepository;
import com.event.snappro.SnapPro.service.PhotographerProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PhotographerProfileServiceImpl implements PhotographerProfileService {
    private final UserRepository userRepository;
    private final PhotographerProfileRepository profileRepository;

    public PhotographerProfileServiceImpl(UserRepository userRepository,
                                           PhotographerProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @Override
    @Transactional
    public PhotographerProfileResponseDTO getProfile(String email) {
        UserEntity user = findPhotographer(email);
        return toResponse(user, findOrCreateProfile(user));
    }

    @Override
    @Transactional
    public Integer getOrCreateProfileId(String email) {
        UserEntity user = findPhotographer(email);
        return findOrCreateProfile(user).getId();
    }

    @Override
    @Transactional
    public PhotographerProfileResponseDTO updateProfile(String email, PhotographerProfileUpdateDTO dto) {
        UserEntity user = findPhotographer(email);
        PhotographerProfile profile = findOrCreateProfile(user);
        user.setFirstName(dto.getFirstName().trim());
        user.setLastName(dto.getLastName().trim());
        user.setMobile(dto.getMobile().trim());
        profile.setExperienceYears(dto.getExperienceYears());
        profile.setBio(dto.getBio());
        userRepository.save(user);
        profileRepository.save(profile);
        return toResponse(user, profile);
    }

    private UserEntity findPhotographer(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Photographer account not found."));
        if (user.getUserType() == null || !"SENIOR_PHOTOGRAPHER".equalsIgnoreCase(user.getUserType().getRoleName())) {
            throw new IllegalArgumentException("This account is not a senior photographer.");
        }
        if (user.getUserStatus() != null && !"ACTIVE".equalsIgnoreCase(user.getUserStatus().getUserStatus())) {
            throw new IllegalArgumentException("Account is not active.");
        }
        return user;
    }

    private PhotographerProfile findOrCreateProfile(UserEntity user) {
        return profileRepository.findByUser_Id(user.getId()).orElseGet(() -> {
            PhotographerProfile profile = new PhotographerProfile();
            profile.setUser(user);
            profile.setExperienceYears(0);
            return profileRepository.saveAndFlush(profile);
        });
    }

    private PhotographerProfileResponseDTO toResponse(UserEntity user, PhotographerProfile profile) {
        return new PhotographerProfileResponseDTO(user.getFirstName(), user.getLastName(), user.getMobile(),
                user.getEmail(), profile.getExperienceYears(), profile.getBio());
    }
}
