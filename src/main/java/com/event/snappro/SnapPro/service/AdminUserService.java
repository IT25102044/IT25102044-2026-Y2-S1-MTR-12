package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.dto.CreateUserDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import com.event.snappro.SnapPro.dto.UpdateUserDTO;
import jakarta.servlet.http.HttpServletRequest;

public interface AdminUserService {
    ResponseDTO getAllUsers();
    ResponseDTO getUserById(Integer id);
    ResponseDTO createUser(CreateUserDTO createUserDTO, HttpServletRequest request);
    ResponseDTO updateUser(Integer id, UpdateUserDTO updateUserDTO, HttpServletRequest request);
    ResponseDTO toggleUserStatus(Integer id, HttpServletRequest request);
    ResponseDTO deleteUser(Integer id, HttpServletRequest request);
    ResponseDTO getUserStatistics();
}
