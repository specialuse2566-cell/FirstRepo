package com.smarthire.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smarthire.backend.dto.InterviewRequest;
import com.smarthire.backend.model.Interview;
import com.smarthire.backend.service.InterviewService;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    @PostMapping("/schedule")
    public Interview scheduleInterview(@RequestBody InterviewRequest request) {
        return interviewService.scheduleInterview(request);
    }

    @GetMapping("/candidate/{email}")
    public List<Interview> getInterviewsByCandidate(@PathVariable String email) {
        return interviewService.getInterviewsByCandidate(email);
    }

    @GetMapping("/{id}")
    public Interview getInterviewById(@PathVariable String id) {
        return interviewService.getInterviewById(id);
    }

    @PostMapping("/complete/{id}")
    public Interview completeInterview(
            @PathVariable String id,
            @RequestBody List<String> answers) {
        return interviewService.completeInterview(id, answers);
    }
}