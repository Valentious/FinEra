package com.finera.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Gmail (or any SMTP) JavaMailSender wired from {@code application.properties}.
 */
@Configuration
public class MailConfig {

    @Bean
    @Primary
    public JavaMailSender javaMailSender(
            @Value("${otp.mail.host}") String host,
            @Value("${otp.mail.port}") int port,
            @Value("${otp.mail.username}") String username,
            @Value("${otp.mail.password}") String password
    ) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.debug", "false");
        return sender;
    }
}
