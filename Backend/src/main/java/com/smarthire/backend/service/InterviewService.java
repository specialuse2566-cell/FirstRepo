package com.smarthire.backend.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smarthire.backend.dto.InterviewRequest;
import com.smarthire.backend.dto.InterviewResponseRequest;
import com.smarthire.backend.model.Interview;
import com.smarthire.backend.repository.InterviewRepository;

@Service
public class InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    public Interview scheduleInterview(InterviewRequest request) {
        Interview interview = new Interview();
        interview.setCandidateEmail(request.getCandidateEmail());
        interview.setRecruiterEmail(request.getRecruiterEmail());
        interview.setCompany(request.getCompany());
        interview.setJobId(request.getJobId());
        interview.setJobTitle(request.getJobTitle());
        interview.setInterviewType(defaultValue(request.getInterviewType(), "AI_MOCK"));
        interview.setRoleFocus(defaultValue(request.getRoleFocus(), request.getJobTitle()));
        interview.setDifficulty(defaultValue(request.getDifficulty(), "MEDIUM"));
        interview.setScheduledBy(defaultValue(request.getScheduledBy(), "CANDIDATE"));
        interview.setScheduledAt(LocalDateTime.now());
        interview.setScheduledFor(parseScheduledFor(request.getScheduledFor()));
        interview.setDurationMinutes(request.getDurationMinutes() == null ? 45 : request.getDurationMinutes());
        interview.setVideoEnabled(request.getVideoEnabled() == null || request.getVideoEnabled());
        interview.setNotes(request.getNotes());
        interview.setQuestionSource("SMARTHIRE_CURATED_WITH_PRACTICE_LINKS");

        Map<String, List<String>> generatedSet = generateQuestionSet(interview.getRoleFocus(), interview.getInterviewType());
        interview.setQuestionTopics(new ArrayList<>(generatedSet.keySet()));
        interview.setQuestions(flattenQuestions(generatedSet));
        interview.setQuestionLinks(buildQuestionLinks(interview.getQuestions()));

        String meetingCode = buildMeetingCode(interview);
        interview.setVideoMeetingCode(meetingCode);
        interview.setVideoMeetingLink(interview.isVideoEnabled() ? "https://meet.jit.si/" + meetingCode : null);

        if ("AI_MOCK".equalsIgnoreCase(interview.getInterviewType())) {
            interview.setStatus("READY");
            interview.setCandidateConfirmed(true);
            interview.setRecruiterConfirmed(true);
        } else if ("RECRUITER".equalsIgnoreCase(interview.getScheduledBy())) {
            interview.setStatus("PENDING_CONFIRMATION");
            interview.setRecruiterConfirmed(true);
            interview.setCandidateConfirmed(false);
        } else {
            interview.setStatus("PENDING_CONFIRMATION");
            interview.setRecruiterConfirmed(false);
            interview.setCandidateConfirmed(true);
        }

        return interviewRepository.save(interview);
    }

    public List<Interview> getInterviewsByCandidate(String email) {
        return interviewRepository.findByCandidateEmail(email);
    }

    public List<Interview> getInterviewsByRecruiter(String email) {
        return interviewRepository.findByRecruiterEmail(email);
    }

    public Interview getInterviewById(String id) {
        return interviewRepository.findById(id).orElse(null);
    }

    public Interview respondToInterview(String id, InterviewResponseRequest request) {
        Interview interview = interviewRepository.findById(id).orElse(null);
        if (interview == null) return null;

        if (!request.isAccepted()) {
            interview.setStatus("DECLINED");
            return interviewRepository.save(interview);
        }

        if ("RECRUITER".equalsIgnoreCase(request.getRole())) {
            interview.setRecruiterConfirmed(true);
        } else {
            interview.setCandidateConfirmed(true);
        }

        if (interview.isCandidateConfirmed() && interview.isRecruiterConfirmed()) {
            interview.setStatus("CONFIRMED");
        } else {
            interview.setStatus("PENDING_CONFIRMATION");
        }

        return interviewRepository.save(interview);
    }

    public Interview completeInterview(String id, List<String> answers) {
        Interview interview = interviewRepository.findById(id).orElse(null);
        if (interview == null) return null;
        interview.setAnswers(answers);
        interview.setStatus("COMPLETED");
        interview.setCompletedAt(LocalDateTime.now());
        EvaluationResult evaluation = evaluateAnswers(answers, interview.getQuestions() == null ? 0 : interview.getQuestions().size());
        interview.setAnsweredCount(evaluation.answeredCount());
        interview.setScore(evaluation.score());
        interview.setFeedback(generateFeedback(interview.getScore()));
        interview.setEvaluationSummary(evaluation.summary());
        interview.setStrengths(evaluation.strengths());
        interview.setImprovementAreas(evaluation.improvementAreas());
        return interviewRepository.save(interview);
    }

    private LocalDateTime parseScheduledFor(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now().plusDays(1);
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            return LocalDateTime.now().plusDays(1);
        }
    }

    private String defaultValue(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private String buildMeetingCode(Interview interview) {
        String safeRole = interview.getRoleFocus() == null ? "session" : interview.getRoleFocus()
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        return "SmartHire-" + safeRole + "-" + suffix;
    }

    private List<String> flattenQuestions(Map<String, List<String>> questionSet) {
        List<String> questions = new ArrayList<>();
        for (List<String> sectionQuestions : questionSet.values()) {
            questions.addAll(sectionQuestions);
        }
        return questions;
    }

    private Map<String, List<String>> generateQuestionSet(String roleFocus, String interviewType) {
        List<String> fundamentals = new ArrayList<>(List.of(
            "Explain the core data structures you would rely on for a " + roleFocus + " role and when you would trade memory for speed.",
            "How would you debug a slow production issue step by step in a " + roleFocus + " codebase?",
            "Describe how you would make a new feature testable, observable, and easy to maintain."
        ));

        List<String> coding = new ArrayList<>(List.of(
            "LeetCode-style problem: Two Sum. Explain the brute-force solution, then the optimized hash-map approach you would actually submit.",
            "LeetCode-style problem: Group Anagrams. Describe how you would derive a grouping key and analyze time and space complexity.",
            "LeetCode-style problem: Linked List Cycle. Compare using fast/slow pointers with using a hash set and explain the tradeoff.",
            "LeetCode-style problem: Merge Intervals. Walk through sorting, merge conditions, and the edge cases you would test.",
            "LeetCode-style problem: Number of Islands. Explain how you would solve it with DFS or BFS and what the complexity looks like."
        ));

        List<String> systemDesign = new ArrayList<>(List.of(
            "How would you design a notification or interview-scheduling service that avoids duplicate events and supports reminders?",
            "Describe how you would store job applications and interview schedules so both recruiters and candidates can query them efficiently.",
            "What tradeoffs would you consider when adding realtime updates or video meeting links to a hiring platform?"
        ));

        List<String> behavioral = new ArrayList<>(List.of(
            "Tell me about a time you handled conflicting priorities while still shipping quality work.",
            "Describe a project where you influenced architecture or product decisions without formal authority.",
            "How do you communicate technical risks to non-technical stakeholders during delivery pressure?"
        ));

        Collections.shuffle(fundamentals);
        Collections.shuffle(coding);
        Collections.shuffle(systemDesign);
        Collections.shuffle(behavioral);

        Map<String, List<String>> questionSet = new LinkedHashMap<>();
        if ("AI_MOCK".equalsIgnoreCase(interviewType)) {
            questionSet.put("Arrays & Hashing", coding.subList(0, 2));
            questionSet.put("Pointers & Intervals", coding.subList(2, 4));
            questionSet.put("Graphs & Traversal", coding.subList(4, 5));
        } else if ("TECHNICAL".equalsIgnoreCase(interviewType)) {
            questionSet.put("Technical Fundamentals", fundamentals.subList(0, 2));
            questionSet.put("Problem Solving", coding.subList(0, 2));
            questionSet.put("Architecture", systemDesign.subList(0, 2));
        } else {
            questionSet.put("Career & Role Fit", behavioral.subList(0, 2));
            questionSet.put("Execution", fundamentals.subList(0, 1));
            questionSet.put("Collaboration", behavioral.subList(2, 3));
        }
        return questionSet;
    }

    private List<String> buildQuestionLinks(List<String> questions) {
        List<String> links = new ArrayList<>();
        if (questions == null) {
            return links;
        }

        for (String question : questions) {
            String normalized = question == null ? "" : question.toLowerCase();
            if (normalized.contains("two sum")) {
                links.add("https://leetcode.com/problems/two-sum/");
            } else if (normalized.contains("group anagrams")) {
                links.add("https://leetcode.com/problems/group-anagrams/");
            } else if (normalized.contains("linked list cycle")) {
                links.add("https://leetcode.com/problems/linked-list-cycle/");
            } else if (normalized.contains("merge intervals")) {
                links.add("https://leetcode.com/problems/merge-intervals/");
            } else if (normalized.contains("number of islands")) {
                links.add("https://leetcode.com/problems/number-of-islands/");
            } else {
                links.add(null);
            }
        }
        return links;
    }

    private EvaluationResult evaluateAnswers(List<String> answers, int totalQuestions) {
        if (answers == null || answers.isEmpty()) {
            return new EvaluationResult(0.0, 0, "No answers were submitted, so the attempt could not be meaningfully evaluated.",
                    List.of("The test was submitted successfully and is visible to both recruiter and candidate."),
                    List.of("Answer each question before submitting.", "Explain your approach and complexity for stronger evaluation."));
        }

        int answeredCount = 0;
        int depthSignals = 0;
        int complexitySignals = 0;
        int edgeCaseSignals = 0;
        int structureSignals = 0;

        for (String answer : answers) {
            if (answer == null || answer.isBlank()) {
                continue;
            }

            answeredCount++;
            String normalized = answer.toLowerCase(Locale.ROOT);
            int length = answer.trim().length();

            if (length >= 220) depthSignals += 3;
            else if (length >= 140) depthSignals += 2;
            else if (length >= 70) depthSignals += 1;

            if (containsAny(normalized, "time complexity", "space complexity", "o(", "complexity")) {
                complexitySignals++;
            }
            if (containsAny(normalized, "edge case", "null", "empty", "duplicate", "overflow", "boundary")) {
                edgeCaseSignals++;
            }
            if (containsAny(normalized, "approach", "first", "then", "finally", "step", "because")) {
                structureSignals++;
            }
        }

        double completionScore = totalQuestions == 0 ? 0.0 : (answeredCount * 4.0) / totalQuestions;
        double depthScore = Math.min(depthSignals / (double) Math.max(totalQuestions, 1), 3.0);
        double qualitySignals = Math.min((complexitySignals + edgeCaseSignals + structureSignals) / (double) Math.max(totalQuestions, 1), 3.0);
        double finalScore = roundToOneDecimal(Math.min(10.0, completionScore + depthScore + qualitySignals));

        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();

        if (answeredCount == totalQuestions && totalQuestions > 0) {
            strengths.add("All questions were attempted before submission.");
        } else {
            improvements.add("Try to answer every question to improve your overall evaluation.");
        }

        if (complexitySignals >= Math.max(1, totalQuestions / 2)) {
            strengths.add("The submission discusses complexity or performance tradeoffs.");
        } else {
            improvements.add("Mention time and space complexity for coding questions.");
        }

        if (edgeCaseSignals >= Math.max(1, totalQuestions / 3)) {
            strengths.add("Edge cases and failure scenarios are being considered.");
        } else {
            improvements.add("Call out important edge cases and boundary conditions.");
        }

        if (structureSignals >= Math.max(1, totalQuestions / 2)) {
            strengths.add("Answers are structured and easier to review.");
        } else {
            improvements.add("Use a clearer answer structure: approach, logic, complexity, and edge cases.");
        }

        if (depthSignals >= totalQuestions * 2) {
            strengths.add("The answers show good detail and depth.");
        } else {
            improvements.add("Add more explanation depth so the reviewer can follow your reasoning.");
        }

        while (strengths.size() > 3) {
            strengths.remove(strengths.size() - 1);
        }
        while (improvements.size() > 3) {
            improvements.remove(improvements.size() - 1);
        }

        String summary = buildEvaluationSummary(finalScore, answeredCount, totalQuestions);
        return new EvaluationResult(finalScore, answeredCount, summary, strengths, improvements);
    }

    private String generateFeedback(double score) {
        if (score >= 8.5) return "Excellent performance with strong structure, detail, and clarity.";
        if (score >= 6.5) return "Good performance. Answers show promise with room for sharper depth.";
        if (score >= 4.5) return "Average performance. Strengthen examples, structure, and technical precision.";
        return "Below average. Spend more time on fundamentals and answer structure before the next round.";
    }

    private String buildEvaluationSummary(double score, int answeredCount, int totalQuestions) {
        if (score >= 8.5) {
            return "High-quality submission. The attempt is well completed and communicates technical reasoning clearly.";
        }
        if (score >= 6.5) {
            return "Solid submission. The core ideas are visible, but there is still room to improve precision and depth.";
        }
        if (score >= 4.5) {
            return "Mixed submission. Some answers are promising, but the overall attempt needs more structure and technical detail.";
        }
        return "The attempt is visible to both recruiter and candidate, but it needs significantly stronger answer coverage and explanation quality."
                + " Submitted answers: " + answeredCount + "/" + totalQuestions + ".";
    }

    private boolean containsAny(String text, String... fragments) {
        for (String fragment : fragments) {
            if (text.contains(fragment)) {
                return true;
            }
        }
        return false;
    }

    private double roundToOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record EvaluationResult(
            double score,
            int answeredCount,
            String summary,
            List<String> strengths,
            List<String> improvementAreas) {
    }
}
