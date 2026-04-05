package com.smarthire.backend.dto;

import lombok.Data;

@Data
public class InterviewRequest {
    private String candidateEmail;
    private String jobId;
    private String jobTitle;
    private String interviewType;
}