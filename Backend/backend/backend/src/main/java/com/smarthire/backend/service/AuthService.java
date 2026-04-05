package com.smarthire.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.smarthire.backend.config.JwtUtil;
import com.smarthire.backend.dto.LoginRequest;
import com.smarthire.backend.dto.RegisterRequest;
import com.smarthire.backend.model.User;
import com.smarthire.backend.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already exists!";
        }
        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setCompanyName(request.getCompanyName());
        userRepository.save(user);
        return "User registered successfully: " + request.getEmail();
    }

    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            return "User not found!";
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return "Invalid password!";
        }
        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }

}