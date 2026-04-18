package com.finera.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOtpRequest(
        @NotBlank(message = "recipient is required")
        String recipient,

        @NotBlank(message = "otp is required")
        @Pattern(regexp = "\\d{6}", message = "otp must be a 6-digit code")
        String otp
) {
}
