package com.smarthire.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smarthire.backend.dto.UserProfileUpdateRequest;
import com.smarthire.backend.model.User;
import com.smarthire.backend.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile/{email}")
    public User getProfile(@PathVariable String email) {
        return userService.getProfile(email);
    }

    @PutMapping("/profile/{email}")
    public User updateProfile(
            @PathVariable String email,
            @RequestBody UserProfileUpdateRequest request) {
        return userService.updateProfile(email, request);
    }
}
