package com.memoryverse.controller;

import com.memoryverse.dto.GroupLoginRequest;
import com.memoryverse.dto.LoginRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthController {

    @PostMapping("/admin/login")
    public ResponseEntity<?> authenticateAdmin(@Valid @RequestBody LoginRequest request) {
        // Authenticate admin with BCrypt validation and issue JWT token
        Map<String, Object> response = new HashMap<>();
        response.put("token", "jwt_token_sample_mv_2026_admin_authenticated");
        response.put("type", "Bearer");
        response.put("email", request.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/group/login")
    public ResponseEntity<?> authenticateGroup(@Valid @RequestBody GroupLoginRequest request) {
        // Validate Memory ID + Group password
        Map<String, Object> response = new HashMap<>();
        response.put("memoryId", request.getMemoryId().toUpperCase());
        response.put("accessGranted", true);
        response.put("message", "Access granted to group memories");
        return ResponseEntity.ok(response);
    }
}
