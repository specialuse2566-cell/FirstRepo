package com.smarthire.backend.dto;

import lombok.Data;

@Data
public class JobApplicationRequest {
    private String candidateEmail;
    private String jobId;
    private String coverLetter;
}