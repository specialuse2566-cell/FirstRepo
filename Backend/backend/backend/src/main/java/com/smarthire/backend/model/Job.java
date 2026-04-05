package com.smarthire.backend.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "jobs")
public class Job {

    @Id
    private String id;

    private String title;
    private String description;
    private String company;
    private String location;
    private String jobType; // FULL_TIME, PART_TIME, REMOTE
    private String experienceLevel; // JUNIOR, MID, SENIOR
    private List<String> skills;
    private String salary;
    private String postedBy; // recruiter email
    private LocalDateTime postedAt;
    private boolean active = true;
}