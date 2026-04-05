package com.smarthire.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smarthire.backend.dto.JobApplicationRequest;
import com.smarthire.backend.model.JobApplication;
import com.smarthire.backend.service.JobApplicationService;

@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {

    @Autowired
    private JobApplicationService jobApplicationService;

    @PostMapping("/apply")
    public String applyForJob(@RequestBody JobApplicationRequest request) {
        return jobApplicationService.applyForJob(request);
    }

    @GetMapping("/candidate/{email}")
    public List<JobApplication> getApplicationsByCandidate(@PathVariable String email) {
        return jobApplicationService.getApplicationsByCandidate(email);
    }

    @GetMapping("/job/{jobId}")
    public List<JobApplication> getApplicationsByJob(@PathVariable String jobId) {
        return jobApplicationService.getApplicationsByJob(jobId);
    }

    @GetMapping("/recruiter/{email}")
    public List<JobApplication> getApplicationsByRecruiter(@PathVariable String email) {
        return jobApplicationService.getApplicationsByRecruiter(email);
    }

    @GetMapping("/recruiter/{email}/hired")
    public List<JobApplication> getHiredApplicationsByRecruiter(@PathVariable String email) {
        return jobApplicationService.getHiredApplicationsByRecruiter(email);
    }

    @PutMapping("/status/{id}")
    public String updateStatus(
            @PathVariable String id,
            @RequestParam String status) {
        return jobApplicationService.updateStatus(id, status);
    }
}
