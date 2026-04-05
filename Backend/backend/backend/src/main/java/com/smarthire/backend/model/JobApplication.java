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
@Document(collection = "applications")
public class JobApplication {

    @Id
    private String id;

    private String candidateEmail;
    private String candidateName;
    private String candidatePhone;
    private String candidateHeadline;
    private List<String> candidateSkills;
    private String jobId;
    private String jobTitle;
    private String company;
    private String status; // APPLIED, SHORTLISTED, HIRED, REJECTED
    private String coverLetter;
    private String resumeFileName;
    private String resumeFileData;
    private String cvFileName;
    private String cvFileData;
    private LocalDateTime appliedAt;
    private LocalDateTime statusUpdatedAt;
    private List<ApplicationStatusLog> statusHistory;
}
