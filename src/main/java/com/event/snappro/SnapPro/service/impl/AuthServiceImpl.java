package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.CreateUserDTO;
import com.event.snappro.SnapPro.dto.LoginDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.dto.UserDTO;
import com.event.snappro.SnapPro.entity.UserEntity;
import com.event.snappro.SnapPro.entity.UserStatusEntity;
import com.event.snappro.SnapPro.entity.UserTypeEntity;
import com.event.snappro.SnapPro.repository.UserRepository;
import com.event.snappro.SnapPro.repository.UserStatusRepository;
import com.event.snappro.SnapPro.repository.UserTypeRepository;
import com.event.snappro.SnapPro.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final UserStatusRepository userStatusRepository;
    private final ModelMapper modelMapper;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    @Override
    public ResponseDTO login(LoginDTO loginDTO, HttpServletRequest request) {
        if (loginDTO == null || loginDTO.getEmail() == null || loginDTO.getPassword() == null) {
            return new ResponseDTO(false, "Please provide both email and password.", null);
        }

        String email = loginDTO.getEmail().trim();
        String password = loginDTO.getPassword();

        Optional<UserEntity> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return new ResponseDTO(false, "Invalid email or password.", null);
        }

        UserEntity user = userOptional.get();

        // Plain text password comparison
        if (!user.getPassword().equals(password)) {
            return new ResponseDTO(false, "Invalid email or password.", null);
        }

        // Check if user status is active
        if (user.getUserStatus() != null && !"ACTIVE".equalsIgnoreCase(user.getUserStatus().getUserStatus())) {
            return new ResponseDTO(false, "Account is not active. Status: " + user.getUserStatus().getUserStatus(), null);
        }

        // Standard Jakarta Servlet HttpSession management
        HttpSession session = request.getSession(true);
        session.setAttribute("userId", user.getId());
        session.setAttribute("userEmail", user.getEmail());
        session.setAttribute("userName", user.getFirstName() + " " + user.getLastName());
        
        String roleName = user.getUserType() != null ? user.getUserType().getRoleName() : "CUSTOMER";
        session.setAttribute("userRole", roleName);
        session.setMaxInactiveInterval(1800); // 30 minutes session timeout

        String statusName = user.getUserStatus() != null ? user.getUserStatus().getUserStatus() : "ACTIVE";
        
        // Use ModelMapper to map entity to DTO
        UserDTO userDTO = modelMapper.map(user, UserDTO.class);
        userDTO.setRole(roleName);
        userDTO.setStatus(statusName);

        return new ResponseDTO(true, "Login Successful!", userDTO);
    }

    @Override
    public ResponseDTO logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return new ResponseDTO(true, "Logged out successfully.", null);
    }

    @Override
    public ResponseDTO checkSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return new ResponseDTO(false, "No active session found.", null);
        }

        Integer userId = (Integer) session.getAttribute("userId");
        Optional<UserEntity> userOptional = userRepository.findById(userId);

        if (userOptional.isEmpty()) {
            session.invalidate();
            return new ResponseDTO(false, "User not found.", null);
        }

        UserEntity user = userOptional.get();
        String roleName = user.getUserType() != null ? user.getUserType().getRoleName() : "CUSTOMER";
        String statusName = user.getUserStatus() != null ? user.getUserStatus().getUserStatus() : "ACTIVE";

        // Use ModelMapper to map entity to DTO
        UserDTO userDTO = modelMapper.map(user, UserDTO.class);
        userDTO.setRole(roleName);
        userDTO.setStatus(statusName);

        return new ResponseDTO(true, "Session valid.", userDTO);
    }

    @Override
    public ResponseDTO register(CreateUserDTO dto) {
        if (dto == null) {
            return new ResponseDTO(false, "Invalid registration data.", null);
        }

        String firstName = dto.getFirstName() != null ? dto.getFirstName().trim() : "";
        String lastName = dto.getLastName() != null ? dto.getLastName().trim() : "";
        String email = dto.getEmail() != null ? dto.getEmail().trim().toLowerCase() : "";
        String mobile = dto.getMobile() != null ? dto.getMobile().trim() : "";
        String password = dto.getPassword() != null ? dto.getPassword().trim() : "";

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

        // Customer Role
        UserTypeEntity customerType = userTypeRepository.findByRoleNameIgnoreCase("CUSTOMER")
                .orElseGet(() -> {
                    UserTypeEntity t = new UserTypeEntity();
                    t.setRoleName("CUSTOMER");
                    return userTypeRepository.save(t);
                });

        // Active Status
        UserStatusEntity activeStatus = userStatusRepository.findByUserStatusIgnoreCase("ACTIVE")
                .orElseGet(() -> {
                    UserStatusEntity s = new UserStatusEntity();
                    s.setUserStatus("ACTIVE");
                    return userStatusRepository.save(s);
                });

        UserEntity userEntity = new UserEntity();
        userEntity.setFirstName(firstName);
        userEntity.setLastName(lastName);
        userEntity.setEmail(email);
        userEntity.setMobile(mobile);
        userEntity.setPassword(password);
        userEntity.setUserType(customerType);
        userEntity.setUserStatus(activeStatus);
        userEntity.setCreatedAt(LocalDateTime.now());

        UserEntity saved = userRepository.save(userEntity);

        UserDTO userDTO = modelMapper.map(saved, UserDTO.class);
        userDTO.setRole("CUSTOMER");
        userDTO.setStatus("ACTIVE");

        return new ResponseDTO(true, "Registration successful! You can now sign in.", userDTO);
    }
}

