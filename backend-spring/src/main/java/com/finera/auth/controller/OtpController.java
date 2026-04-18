package com.finera.auth.controller;

import com.finera.auth.dto.OtpResponse;
import com.finera.auth.dto.SendOtpRequest;
import com.finera.auth.dto.VerifyOtpRequest;
import com.finera.auth.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<OtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        otpService.sendOtp(request.recipient(), request.normalizedType());
        return ResponseEntity.ok(OtpResponse.ok("OTP sent successfully."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<OtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean valid = otpService.verifyOtp(request.recipient(), request.otp());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(OtpResponse.fail("Invalid or expired OTP."));
        }
        return ResponseEntity.ok(OtpResponse.ok("OTP verified successfully."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<OtpResponse> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(OtpResponse.fail(ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<OtpResponse> sendFailed(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(OtpResponse.fail(ex.getMessage()));
    }
}
