package com.smarthire.backend.dto;

import java.util.List;

import lombok.Data;

@Data
public class JobRequest {
    private String title;
    private String description;
    private String company;
    private String location;
    private String jobType;
    private String experienceLevel;
    private List<String> skills;
    private String salary;
    private String postedBy;
}