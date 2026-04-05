package com.smarthire.backend.dto;

import java.util.List;

import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    private String firstName;
    private String lastName;
    private String companyName;
    private String phone;
    private String location;
    private String headline;
    private String bio;
    private String avatarImageData;
    private List<String> skills;
    private Integer experienceYears;
}
