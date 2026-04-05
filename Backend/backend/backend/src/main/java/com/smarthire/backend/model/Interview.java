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
@Document(collection = "interviews")
public class Interview {

    @Id
    private String id;

    private String candidateEmail;
    private String jobId;
    private String jobTitle;
    private String status; // SCHEDULED, COMPLETED, CANCELLED
    private String interviewType; // AI_MOCK, TECHNICAL, HR
    private List<String> questions;
    private List<String> answers;
    private double score;
    private String feedback;
    private LocalDateTime scheduledAt;
    private LocalDateTime completedAt;
}