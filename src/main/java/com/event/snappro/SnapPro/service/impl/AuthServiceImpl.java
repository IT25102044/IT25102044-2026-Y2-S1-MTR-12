package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.dto.LoginDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.dto.UserDTO;
import com.event.snappro.SnapPro.entity.UserEntity;
import com.event.snappro.SnapPro.repository.UserRepository;
import com.event.snappro.SnapPro.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

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
}
