package com.smarthire.backend.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStatusLog {

    private String status;
    private String actorRole;
    private String actorEmail;
    private String message;
    private LocalDateTime changedAt;
}
