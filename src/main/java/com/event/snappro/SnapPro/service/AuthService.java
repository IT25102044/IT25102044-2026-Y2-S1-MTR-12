package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.dto.LoginDTO;
import com.event.snappro.SnapPro.dto.ResponseDTO;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    ResponseDTO login(LoginDTO loginDTO, HttpServletRequest request);
    ResponseDTO logout(HttpServletRequest request);
    ResponseDTO checkSession(HttpServletRequest request);
}
