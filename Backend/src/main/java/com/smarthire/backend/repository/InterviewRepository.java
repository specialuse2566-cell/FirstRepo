package com.smarthire.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.smarthire.backend.model.Interview;

@Repository
public interface InterviewRepository extends MongoRepository<Interview, String> {
    List<Interview> findByCandidateEmail(String email);
    List<Interview> findByRecruiterEmail(String email);
    List<Interview> findByJobId(String jobId);
    List<Interview> findByStatus(String status);
}
