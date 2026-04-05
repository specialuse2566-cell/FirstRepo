package com.smarthire.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.smarthire.backend.model.Job;

@Repository
public interface JobRepository extends MongoRepository<Job, String> {
    List<Job> findByActive(boolean active);
    List<Job> findByPostedBy(String postedBy);
    List<Job> findByTitleContainingIgnoreCase(String title);
}