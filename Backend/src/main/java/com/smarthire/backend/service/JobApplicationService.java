package com.smarthire.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smarthire.backend.dto.JobApplicationRequest;
import com.smarthire.backend.model.ApplicationStatusLog;
import com.smarthire.backend.model.Job;
import com.smarthire.backend.model.JobApplication;
import com.smarthire.backend.repository.JobApplicationRepository;
import com.smarthire.backend.repository.JobRepository;

@Service
public class JobApplicationService {

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private JobRepository jobRepository;

    public String applyForJob(JobApplicationRequest request) {
        if (jobApplicationRepository.existsByCandidateEmailAndJobId(
                request.getCandidateEmail(), request.getJobId())) {
            return "You have already applied for this job!";
        }
        Job job = jobRepository.findById(request.getJobId()).orElse(null);
        if (job == null) return "Job not found!";

        JobApplication application = new JobApplication();
        application.setCandidateEmail(request.getCandidateEmail());
        application.setCandidateName(request.getCandidateName());
        application.setCandidatePhone(request.getCandidatePhone());
        application.setCandidateHeadline(request.getCandidateHeadline());
        application.setCandidateSkills(request.getCandidateSkills());
        application.setJobId(request.getJobId());
        application.setJobTitle(job.getTitle());
        application.setCompany(job.getCompany());
        application.setStatus("APPLIED");
        application.setCoverLetter(request.getCoverLetter());
        application.setResumeFileName(request.getResumeFileName());
        application.setResumeFileData(request.getResumeFileData());
        application.setCvFileName(request.getCvFileName());
        application.setCvFileData(request.getCvFileData());
        application.setAppliedAt(LocalDateTime.now());
        application.setStatusUpdatedAt(application.getAppliedAt());
        application.setStatusHistory(new ArrayList<>(List.of(buildStatusLog(
                "APPLIED",
                "CANDIDATE",
                request.getCandidateEmail(),
                application.getAppliedAt(),
                "Application submitted by candidate."
        ))));
        jobApplicationRepository.save(application);
        return "Application submitted successfully!";
    }

    public List<JobApplication> getApplicationsByCandidate(String email) {
        return sortApplications(jobApplicationRepository.findByCandidateEmail(email));
    }

    public List<JobApplication> getApplicationsByJob(String jobId) {
        return sortApplications(jobApplicationRepository.findByJobId(jobId));
    }

    public List<JobApplication> getApplicationsByRecruiter(String recruiterEmail) {
        List<String> jobIds = jobRepository.findByPostedBy(recruiterEmail)
                .stream()
                .map(Job::getId)
                .toList();

        if (jobIds.isEmpty()) {
            return Collections.emptyList();
        }

        return sortApplications(jobApplicationRepository.findByJobIdIn(jobIds));
    }

    public List<JobApplication> getHiredApplicationsByRecruiter(String recruiterEmail) {
        List<String> jobIds = jobRepository.findByPostedBy(recruiterEmail)
                .stream()
                .map(Job::getId)
                .toList();

        if (jobIds.isEmpty()) {
            return Collections.emptyList();
        }

        return sortApplications(jobApplicationRepository.findByJobIdInAndStatus(jobIds, "HIRED"));
    }

    public String updateStatus(String id, String status) {
        JobApplication application = jobApplicationRepository.findById(id).orElse(null);
        if (application == null) return "Application not found!";
        normalizeStatusHistory(application);
        if (status != null && status.equalsIgnoreCase(application.getStatus())) {
            return "Status already set to: " + status;
        }

        application.setStatus(status);
        LocalDateTime changedAt = LocalDateTime.now();
        application.setStatusUpdatedAt(changedAt);
        application.getStatusHistory().add(buildStatusLog(
                status,
                "RECRUITER",
                null,
                changedAt,
                buildStatusMessage(status)
        ));
        jobApplicationRepository.save(application);
        return "Status updated to: " + status;
    }

    private List<JobApplication> sortApplications(List<JobApplication> applications) {
        return applications.stream()
                .map(this::normalizeStatusHistory)
                .sorted(Comparator.comparing(this::getSortDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private JobApplication normalizeStatusHistory(JobApplication application) {
        List<ApplicationStatusLog> history = application.getStatusHistory() == null
                ? new ArrayList<>()
                : new ArrayList<>(application.getStatusHistory());

        if (history.isEmpty() && application.getAppliedAt() != null) {
            history.add(buildStatusLog(
                    "APPLIED",
                    "CANDIDATE",
                    application.getCandidateEmail(),
                    application.getAppliedAt(),
                    "Application submitted by candidate."
            ));
        }

        if (application.getStatus() != null && !application.getStatus().isBlank()) {
            boolean hasCurrentStatus = history.stream()
                    .anyMatch(entry -> application.getStatus().equalsIgnoreCase(entry.getStatus()));

            if (!hasCurrentStatus) {
                history.add(buildStatusLog(
                        application.getStatus(),
                        "RECRUITER",
                        null,
                        application.getStatusUpdatedAt() != null ? application.getStatusUpdatedAt() : application.getAppliedAt(),
                        buildStatusMessage(application.getStatus())
                ));
            }
        }

        history.sort(Comparator.comparing(ApplicationStatusLog::getChangedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        application.setStatusHistory(history);

        if (application.getStatusUpdatedAt() == null) {
            application.setStatusUpdatedAt(history.isEmpty() ? application.getAppliedAt() : history.get(history.size() - 1).getChangedAt());
        }

        return application;
    }

    private LocalDateTime getSortDate(JobApplication application) {
        return application.getStatusUpdatedAt() != null ? application.getStatusUpdatedAt() : application.getAppliedAt();
    }

    private ApplicationStatusLog buildStatusLog(
            String status,
            String actorRole,
            String actorEmail,
            LocalDateTime changedAt,
            String message) {
        return new ApplicationStatusLog(status, actorRole, actorEmail, message, changedAt);
    }

    private String buildStatusMessage(String status) {
        if ("HIRED".equalsIgnoreCase(status)) {
            return "Recruiter marked the application as hired.";
        }
        if ("REJECTED".equalsIgnoreCase(status)) {
            return "Recruiter closed the application as rejected.";
        }
        if ("SHORTLISTED".equalsIgnoreCase(status)) {
            return "Recruiter shortlisted the application for the next stage.";
        }
        return "Application is currently in progress.";
    }
}
