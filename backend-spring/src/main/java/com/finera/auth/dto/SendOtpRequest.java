package com.finera.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SendOtpRequest(
        @NotBlank(message = "recipient is required")
        String recipient,

        @NotBlank(message = "type is required")
        @Pattern(regexp = "email|sms", flags = Pattern.Flag.CASE_INSENSITIVE, message = "type must be 'email' or 'sms'")
        String type
) {
    public String normalizedType() {
        return type == null ? "" : type.trim().toLowerCase();
    }
}
