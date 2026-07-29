package com.memoryverse.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GroupLoginRequest {

    @NotBlank(message = "Memory ID is required")
    private String memoryId;

    @NotBlank(message = "Password is required")
    private String password;
}
