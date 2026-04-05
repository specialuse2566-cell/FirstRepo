package com.smarthire.backend.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smarthire.backend.dto.InterviewRequest;
import com.smarthire.backend.model.Interview;
import com.smarthire.backend.repository.InterviewRepository;

@Service
public class InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    public Interview scheduleInterview(InterviewRequest request) {
        Interview interview = new Interview();
        interview.setCandidateEmail(request.getCandidateEmail());
        interview.setJobId(request.getJobId());
        interview.setJobTitle(request.getJobTitle());
        interview.setInterviewType(request.getInterviewType());
        interview.setStatus("SCHEDULED");
        interview.setScheduledAt(LocalDateTime.now());
        interview.setQuestions(generateQuestions(request.getJobTitle()));
        return interviewRepository.save(interview);
    }

    public List<Interview> getInterviewsByCandidate(String email) {
        return interviewRepository.findByCandidateEmail(email);
    }

    public Interview getInterviewById(String id) {
        return interviewRepository.findById(id).orElse(null);
    }

    public Interview completeInterview(String id, List<String> answers) {
        Interview interview = interviewRepository.findById(id).orElse(null);
        if (interview == null) return null;
        interview.setAnswers(answers);
        interview.setStatus("COMPLETED");
        interview.setCompletedAt(LocalDateTime.now());
        interview.setScore(calculateScore(answers));
        interview.setFeedback(generateFeedback(interview.getScore()));
        return interviewRepository.save(interview);
    }

    private List<String> generateQuestions(String jobTitle) {
        return Arrays.asList(
            "Tell me about yourself and your experience with " + jobTitle,
            "What are your key technical skills?",
            "Describe a challenging project you worked on.",
            "How do you handle pressure and tight deadlines?",
            "Where do you see yourself in 5 years?"
        );
    }

    private double calculateScore(List<String> answers) {
        if (answers == null || answers.isEmpty()) return 0.0;
        double score = 0;
        for (String answer : answers) {
            if (answer != null && answer.length() > 50) score += 2.0;
            else if (answer != null && answer.length() > 20) score += 1.0;
        }
        return Math.min(score, 10.0);
    }

    private String generateFeedback(double score) {
        if (score >= 8) return "Excellent performance! Strong candidate.";
        if (score >= 6) return "Good performance. Consider for next round.";
        if (score >= 4) return "Average performance. Needs improvement.";
        return "Below average. Not recommended.";
    }
}