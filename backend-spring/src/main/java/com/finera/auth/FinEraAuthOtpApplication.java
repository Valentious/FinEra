package com.finera.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration;

@SpringBootApplication(exclude = {MailSenderAutoConfiguration.class})
public class FinEraAuthOtpApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinEraAuthOtpApplication.class, args);
    }
}
