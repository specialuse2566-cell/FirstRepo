package com.smarthire.backend.dto;

import lombok.Data;

@Data
public class InterviewRequest {
    private String candidateEmail;
    private String recruiterEmail;
    private String company;
    private String jobId;
    private String jobTitle;
    private String interviewType;
    private String roleFocus;
    private String difficulty;
    private String scheduledBy;
    private String scheduledFor;
    private Integer durationMinutes;
    private Boolean videoEnabled;
    private String notes;
}
