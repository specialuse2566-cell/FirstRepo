package com.smarthire.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smarthire.backend.dto.JobApplicationRequest;
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
        application.setJobId(request.getJobId());
        application.setJobTitle(job.getTitle());
        application.setCompany(job.getCompany());
        application.setStatus("APPLIED");
        application.setCoverLetter(request.getCoverLetter());
        application.setAppliedAt(LocalDateTime.now());
        jobApplicationRepository.save(application);
        return "Application submitted successfully!";
    }

    public List<JobApplication> getApplicationsByCandidate(String email) {
        return jobApplicationRepository.findByCandidateEmail(email);
    }

    public List<JobApplication> getApplicationsByJob(String jobId) {
        return jobApplicationRepository.findByJobId(jobId);
    }

    public String updateStatus(String id, String status) {
        JobApplication application = jobApplicationRepository.findById(id).orElse(null);
        if (application == null) return "Application not found!";
        application.setStatus(status);
        jobApplicationRepository.save(application);
        return "Status updated to: " + status;
    }
}