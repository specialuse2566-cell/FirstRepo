package com.smarthire.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.smarthire.backend.model.JobApplication;

@Repository
public interface JobApplicationRepository extends MongoRepository<JobApplication, String> {
    List<JobApplication> findByCandidateEmail(String email);
    List<JobApplication> findByJobId(String jobId);
    List<JobApplication> findByJobIdIn(List<String> jobIds);
    List<JobApplication> findByJobIdInAndStatus(List<String> jobIds, String status);
    boolean existsByCandidateEmailAndJobId(String email, String jobId);
}
