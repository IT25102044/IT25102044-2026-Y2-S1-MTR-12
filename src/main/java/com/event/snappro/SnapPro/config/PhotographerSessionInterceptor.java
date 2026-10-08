package com.event.snappro.SnapPro.config;

import com.event.snappro.SnapPro.entity.UserEntity;
import com.event.snappro.SnapPro.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;

@Component
public class PhotographerSessionInterceptor implements HandlerInterceptor {
    private final UserRepository users;
    public PhotographerSessionInterceptor(UserRepository users) { this.users = users; }

    @Override
    @Transactional(readOnly = true)
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        response.setHeader("Cache-Control", "no-store");
        HttpSession session = request.getSession(false);
        Object id = session == null ? null : session.getAttribute("userId");
        if (!(id instanceof Integer)) {
            deny(request, response, 401, "Login required");
            return false;
        }
        UserEntity user = users.findById((Integer) id).orElse(null);
        boolean allowed = user != null && user.getUserType() != null
                && "SENIOR_PHOTOGRAPHER".equalsIgnoreCase(user.getUserType().getRoleName())
                && (user.getUserStatus() == null
                    || "ACTIVE".equalsIgnoreCase(user.getUserStatus().getUserStatus()));
        if (!allowed) {
            deny(request, response, 403, "Senior Photographer access required");
            return false;
        }
        // Protect against replay of a session previously authorized for a different user.
        if (!user.getEmail().equalsIgnoreCase(String.valueOf(session.getAttribute("userEmail")))) {
            deny(request, response, 403, "Invalid login session");
            return false;
        }
        return true;
    }

    private void deny(HttpServletRequest request, HttpServletResponse response, int status, String reason)
            throws IOException {
        if (request.getRequestURI().endsWith("/photographer.html")) {
            response.sendRedirect(request.getContextPath() + "/login.html");
        } else {
            response.setStatus(status);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"" + reason + "\"}");
        }
    }
}
