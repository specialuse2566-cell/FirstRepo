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
    private String recruiterEmail;
    private String company;
    private String jobId;
    private String jobTitle;
    private String status; // READY, PENDING_CONFIRMATION, CONFIRMED, COMPLETED, DECLINED, CANCELLED
    private String interviewType; // AI_MOCK, TECHNICAL, HR
    private String roleFocus;
    private String difficulty;
    private String scheduledBy; // CANDIDATE or RECRUITER
    private LocalDateTime scheduledFor;
    private Integer durationMinutes;
    private boolean recruiterConfirmed;
    private boolean candidateConfirmed;
    private boolean videoEnabled;
    private String videoMeetingCode;
    private String videoMeetingLink;
    private String notes;
    private String questionSource;
    private List<String> questionTopics;
    private List<String> questions;
    private List<String> questionLinks;
    private List<String> answers;
    private Integer answeredCount;
    private double score;
    private String feedback;
    private String evaluationSummary;
    private List<String> strengths;
    private List<String> improvementAreas;
    private LocalDateTime scheduledAt;
    private LocalDateTime completedAt;
}
