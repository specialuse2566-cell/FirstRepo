package com.smarthire.backend.dto;

import lombok.Data;

@Data
public class InterviewResponseRequest {
    private String role;
    private boolean accepted;
}
