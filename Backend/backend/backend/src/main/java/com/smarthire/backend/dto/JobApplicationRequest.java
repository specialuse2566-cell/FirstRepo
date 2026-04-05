package com.smarthire.backend.dto;

import java.util.List;

import lombok.Data;

@Data
public class JobApplicationRequest {
    private String candidateEmail;
    private String candidateName;
    private String candidatePhone;
    private String candidateHeadline;
    private List<String> candidateSkills;
    private String jobId;
    private String coverLetter;
    private String resumeFileName;
    private String resumeFileData;
    private String cvFileName;
    private String cvFileData;
}
