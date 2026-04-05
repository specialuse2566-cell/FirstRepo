package com.smarthire.backend.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "applications")
public class JobApplication {

    @Id
    private String id;

    private String candidateEmail;
    private String jobId;
    private String jobTitle;
    private String company;
    private String status; // APPLIED, REVIEWED, SHORTLISTED, REJECTED
    private String coverLetter;
    private LocalDateTime appliedAt;
}
