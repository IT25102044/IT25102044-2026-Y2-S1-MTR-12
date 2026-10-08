package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.*;
import com.event.snappro.SnapPro.entity.UserEntity;
import com.event.snappro.SnapPro.entity.UserStatusEntity;
import com.event.snappro.SnapPro.entity.UserTypeEntity;
import com.event.snappro.SnapPro.repository.UserRepository;
import com.event.snappro.SnapPro.repository.UserStatusRepository;
import com.event.snappro.SnapPro.repository.UserTypeRepository;
import com.event.snappro.SnapPro.service.AdminUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final UserStatusRepository userStatusRepository;
    private final ModelMapper modelMapper;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    @Override
    public ResponseDTO getAllUsers() {
        List<UserEntity> users = userRepository.findAll();
        List<UserDTO> dtoList = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return new ResponseDTO(true, "Users retrieved successfully.", dtoList);
    }

    @Override
    public ResponseDTO getUserById(Integer id) {
        Optional<UserEntity> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return new ResponseDTO(false, "User not found with ID: " + id, null);
        }
        return new ResponseDTO(true, "User found.", convertToDTO(userOptional.get()));
    }

    @Override
    public ResponseDTO createUser(CreateUserDTO dto, HttpServletRequest request) {
        if (dto == null) {
            return new ResponseDTO(false, "Invalid user data.", null);
        }

        String firstName = dto.getFirstName() != null ? dto.getFirstName().trim() : "";
        String lastName = dto.getLastName() != null ? dto.getLastName().trim() : "";
        String email = dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : "";
        String mobile = dto.getMobile() != null ? dto.getMobile().trim() : "";
        String password = dto.getPassword() != null ? dto.getPassword().trim() : "";

        // Backend Validations
        if (firstName.isEmpty()) {
            return new ResponseDTO(false, "First name is required.", null);
        }
        if (lastName.isEmpty()) {
            return new ResponseDTO(false, "Last name is required.", null);
        }
        if (email.isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            return new ResponseDTO(false, "Please provide a valid email address.", null);
        }
        if (userRepository.existsByEmail(email)) {
            return new ResponseDTO(false, "An account with email '" + email + "' already exists.", null);
        }
        if (mobile.isEmpty()) {
            return new ResponseDTO(false, "Mobile number is required.", null);
        }
        if (password.isEmpty() || password.length() < 6) {
            return new ResponseDTO(false, "Password must be at least 6 characters long.", null);
        }

        // Determine User Role
        UserTypeEntity userType = resolveUserType(dto.getRoleId(), dto.getRole());

        // Determine User Status (Default: ACTIVE)
        UserStatusEntity userStatus = resolveUserStatus(null, "ACTIVE");

        UserEntity userEntity = new UserEntity();
        userEntity.setFirstName(firstName);
        userEntity.setLastName(lastName);
        userEntity.setEmail(email);
        userEntity.setMobile(mobile);
        userEntity.setPassword(password); // Plain-text as configured
        userEntity.setUserType(userType);
        userEntity.setUserStatus(userStatus);
        userEntity.setCreatedAt(LocalDateTime.now());

        UserEntity saved = userRepository.save(userEntity);
        return new ResponseDTO(true, "User account provisioned successfully!", convertToDTO(saved));
    }

    @Override
    public ResponseDTO updateUser(Integer id, UpdateUserDTO dto, HttpServletRequest request) {
        Optional<UserEntity> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return new ResponseDTO(false, "User not found with ID: " + id, null);
        }

        UserEntity user = userOptional.get();

        if (dto.getFirstName() != null && !dto.getFirstName().trim().isEmpty()) {
            user.setFirstName(dto.getFirstName().trim());
        }
        if (dto.getLastName() != null && !dto.getLastName().trim().isEmpty()) {
            user.setLastName(dto.getLastName().trim());
        }
        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
            String newEmail = dto.getEmail().trim().toLowerCase();
            if (!EMAIL_PATTERN.matcher(newEmail).matches()) {
                return new ResponseDTO(false, "Please provide a valid email address.", null);
            }
            Optional<UserEntity> existingWithEmail = userRepository.findByEmail(newEmail);
            if (existingWithEmail.isPresent() && !existingWithEmail.get().getId().equals(id)) {
                return new ResponseDTO(false, "Email '" + newEmail + "' is already in use by another user.", null);
            }
            user.setEmail(newEmail);
        }
        if (dto.getMobile() != null && !dto.getMobile().trim().isEmpty()) {
            user.setMobile(dto.getMobile().trim());
        }
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            user.setPassword(dto.getPassword().trim());
        }

        // Update Role if provided
        if (dto.getRoleId() != null || (dto.getRole() != null && !dto.getRole().trim().isEmpty())) {
            UserTypeEntity resolvedType = resolveUserType(dto.getRoleId(), dto.getRole());
            if (resolvedType != null) {
                user.setUserType(resolvedType);
            }
        }

        // Update Status if provided
        if (dto.getStatusId() != null || (dto.getStatus() != null && !dto.getStatus().trim().isEmpty())) {
            UserStatusEntity resolvedStatus = resolveUserStatus(dto.getStatusId(), dto.getStatus());
            if (resolvedStatus != null) {
                user.setUserStatus(resolvedStatus);
            }
        }

        UserEntity saved = userRepository.save(user);
        return new ResponseDTO(true, "User account updated successfully!", convertToDTO(saved));
    }

    @Override
    public ResponseDTO toggleUserStatus(Integer id, HttpServletRequest request) {
        Optional<UserEntity> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return new ResponseDTO(false, "User not found with ID: " + id, null);
        }

        UserEntity user = userOptional.get();
        String currentStatus = user.getUserStatus() != null ? user.getUserStatus().getUserStatus() : "ACTIVE";

        String targetStatusName = "ACTIVE".equalsIgnoreCase(currentStatus) ? "INACTIVE" : "ACTIVE";
        UserStatusEntity targetStatus = userStatusRepository.findByUserStatusIgnoreCase(targetStatusName)
                .orElseGet(() -> {
                    UserStatusEntity st = new UserStatusEntity();
                    st.setUserStatus(targetStatusName);
                    return userStatusRepository.save(st);
                });

        user.setUserStatus(targetStatus);
        UserEntity saved = userRepository.save(user);

        return new ResponseDTO(true, "User status changed to " + targetStatusName + " successfully!", convertToDTO(saved));
    }

    @Override
    public ResponseDTO deleteUser(Integer id, HttpServletRequest request) {
        Optional<UserEntity> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return new ResponseDTO(false, "User not found with ID: " + id, null);
        }

        UserEntity user = userOptional.get();

        try {
            userRepository.deleteById(id);
            return new ResponseDTO(true, "User account deleted permanently.", null);
        } catch (Exception ex) {
            // If foreign key constraint prevents physical deletion (bookings, reviews), perform soft deactivation
            UserStatusEntity inactiveStatus = userStatusRepository.findByUserStatusIgnoreCase("INACTIVE")
                    .orElseGet(() -> {
                        UserStatusEntity st = new UserStatusEntity();
                        st.setUserStatus("INACTIVE");
                        return userStatusRepository.save(st);
                    });
            user.setUserStatus(inactiveStatus);
            userRepository.save(user);
            return new ResponseDTO(true, "User has historical records and was deactivated instead of deleted.", null);
        }
    }

    @Override
    public ResponseDTO getUserStatistics() {
        List<UserEntity> users = userRepository.findAll();
        long totalUsers = users.size();
        long activeUsers = users.stream()
                .filter(u -> u.getUserStatus() != null && "ACTIVE".equalsIgnoreCase(u.getUserStatus().getUserStatus()))
                .count();
        long photographers = users.stream()
                .filter(u -> u.getUserType() != null && "PHOTOGRAPHER".equalsIgnoreCase(u.getUserType().getRoleName()))
                .count();
        long suspendedUsers = totalUsers - activeUsers;

        UserStatsDTO stats = new UserStatsDTO(totalUsers, activeUsers, photographers, suspendedUsers);
        return new ResponseDTO(true, "User statistics calculated.", stats);
    }

    private UserDTO convertToDTO(UserEntity entity) {
        UserDTO dto = modelMapper.map(entity, UserDTO.class);
        if (entity.getUserType() != null) {
            dto.setRoleId(entity.getUserType().getId());
            dto.setRole(entity.getUserType().getRoleName());
        } else {
            dto.setRole("CUSTOMER");
        }
        if (entity.getUserStatus() != null) {
            dto.setStatusId(entity.getUserStatus().getId());
            dto.setStatus(entity.getUserStatus().getUserStatus());
        } else {
            dto.setStatus("ACTIVE");
        }
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private UserTypeEntity resolveUserType(Integer roleId, String roleName) {
        if (roleId != null) {
            Optional<UserTypeEntity> byId = userTypeRepository.findById(roleId);
            if (byId.isPresent()) return byId.get();
        }

        if (roleName != null && !roleName.trim().isEmpty()) {
            String trimmed = roleName.trim();
            Optional<UserTypeEntity> exact = userTypeRepository.findByRoleNameIgnoreCase(trimmed);
            if (exact.isPresent()) return exact.get();

            // Try normalized matching (e.g. "Operations Manager" vs "OPERATIONS_MANAGER")
            String cleanQuery = trimmed.toUpperCase().replaceAll("[^A-Z0-9]", "");
            List<UserTypeEntity> allTypes = userTypeRepository.findAll();
            for (UserTypeEntity t : allTypes) {
                String cleanRole = (t.getRoleName() != null ? t.getRoleName() : "").toUpperCase().replaceAll("[^A-Z0-9]", "");
                if (cleanRole.equals(cleanQuery) || cleanRole.contains(cleanQuery) || cleanQuery.contains(cleanRole)) {
                    return t;
                }
            }
        }

        // Fallback to CUSTOMER or first available
        return userTypeRepository.findByRoleNameIgnoreCase("CUSTOMER")
                .orElseGet(() -> userTypeRepository.findAll().stream().findFirst().orElse(null));
    }

    private UserStatusEntity resolveUserStatus(Integer statusId, String statusName) {
        if (statusId != null) {
            Optional<UserStatusEntity> byId = userStatusRepository.findById(statusId);
            if (byId.isPresent()) return byId.get();
        }

        if (statusName != null && !statusName.trim().isEmpty()) {
            String trimmed = statusName.trim();
            Optional<UserStatusEntity> exact = userStatusRepository.findByUserStatusIgnoreCase(trimmed);
            if (exact.isPresent()) return exact.get();

            String cleanQuery = trimmed.toUpperCase().replaceAll("[^A-Z0-9]", "");
            List<UserStatusEntity> allStatuses = userStatusRepository.findAll();
            for (UserStatusEntity s : allStatuses) {
                String cleanStatus = (s.getUserStatus() != null ? s.getUserStatus() : "").toUpperCase().replaceAll("[^A-Z0-9]", "");
                if (cleanStatus.equals(cleanQuery) || cleanStatus.contains(cleanQuery) || cleanQuery.contains(cleanStatus)) {
                    return s;
                }
            }
        }

        return userStatusRepository.findByUserStatusIgnoreCase("ACTIVE")
                .orElseGet(() -> userStatusRepository.findAll().stream().findFirst().orElse(null));
    }
}
