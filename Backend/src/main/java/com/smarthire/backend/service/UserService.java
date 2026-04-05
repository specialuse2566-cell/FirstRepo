package com.smarthire.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smarthire.backend.dto.UserProfileUpdateRequest;
import com.smarthire.backend.model.User;
import com.smarthire.backend.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User getProfile(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User updateProfile(String email, UserProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return null;
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setCompanyName(request.getCompanyName());
        user.setPhone(request.getPhone());
        user.setLocation(request.getLocation());
        user.setHeadline(request.getHeadline());
        user.setBio(request.getBio());
        user.setAvatarImageData(request.getAvatarImageData());
        user.setSkills(request.getSkills());
        user.setExperienceYears(request.getExperienceYears());

        return userRepository.save(user);
    }
}
