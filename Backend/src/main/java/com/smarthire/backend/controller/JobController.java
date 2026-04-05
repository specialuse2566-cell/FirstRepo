package com.smarthire.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smarthire.backend.dto.JobRequest;
import com.smarthire.backend.model.Job;
import com.smarthire.backend.service.JobService;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    @Autowired
    private JobService jobService;

    @PostMapping("/create")
    public Job createJob(@RequestBody JobRequest request) {
        return jobService.createJob(request);
    }

    @GetMapping("/all")
    public List<Job> getAllJobs() {
        return jobService.getAllJobs();
    }

    @GetMapping("/{id}")
    public Job getJobById(@PathVariable String id) {
        return jobService.getJobById(id);
    }

    @GetMapping("/recruiter/{email}")
    public List<Job> getJobsByRecruiter(@PathVariable String email) {
        return jobService.getJobsByRecruiter(email);
    }

    @GetMapping("/search/{keyword}")
    public List<Job> searchJobs(@PathVariable String keyword) {
        return jobService.searchJobs(keyword);
    }

    @DeleteMapping("/{id}")
    public String deleteJob(@PathVariable String id) {
        return jobService.deleteJob(id);
    }
}