package com.smarthire.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smarthire.backend.dto.JobRequest;
import com.smarthire.backend.model.Job;
import com.smarthire.backend.repository.JobRepository;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    public Job createJob(JobRequest request) {
        Job job = new Job();
        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setCompany(request.getCompany());
        job.setLocation(request.getLocation());
        job.setJobType(request.getJobType());
        job.setExperienceLevel(request.getExperienceLevel());
        job.setSkills(request.getSkills());
        job.setSalary(request.getSalary());
        job.setPostedBy(request.getPostedBy());
        job.setPostedAt(LocalDateTime.now());
        return jobRepository.save(job);
    }

    public List<Job> getAllJobs() {
        return jobRepository.findByActive(true);
    }

    public Job getJobById(String id) {
        return jobRepository.findById(id).orElse(null);
    }

    public List<Job> getJobsByRecruiter(String email) {
        return jobRepository.findByPostedBy(email);
    }

    public List<Job> searchJobs(String keyword) {
        return jobRepository.findByTitleContainingIgnoreCase(keyword);
    }

    public String deleteJob(String id) {
        Job job = jobRepository.findById(id).orElse(null);
        if (job == null) return "Job not found!";
        job.setActive(false);
        jobRepository.save(job);
        return "Job deleted successfully!";
    }
}