package com.twoofus.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ClaudeService {

    @Value("${anthropic.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-sonnet-4-6";

    public QuestionResponse generateQuestions(LocalDate date, String theme) {
        String prompt = buildPrompt(date, theme);

        Map<String, Object> body = Map.of(
            "model", MODEL,
            "max_tokens", 2048,
            "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(
            CLAUDE_API_URL,
            new HttpEntity<>(body, headers),
            Map.class
        );

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> content =
            (List<Map<String, Object>>) response.getBody().get("content");

        String text = (String) content.get(0).get("text");

        // Strip BOM and surrounding whitespace before parsing
        text = text.trim();
        if (text.startsWith("﻿")) {
            text = text.substring(1);
        }

        try {
            return objectMapper.readValue(text, QuestionResponse.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse Claude response. Raw response text:\n{}", text);
            throw new RuntimeException(
                "Failed to parse question generation response from Claude: " + e.getMessage(), e);
        }
    }

    private String buildPrompt(LocalDate date, String theme) {
        return """
            Generate exactly 5 multiple-choice questions for a couples quiz app.
            Today's date: %s
            Theme: %s

            Return ONLY valid JSON. No markdown, no explanation, no code fences — raw JSON only.
            The JSON must follow this exact schema:
            {
              "date": "YYYY-MM-DD",
              "theme": "Theme Name",
              "questions": [
                {
                  "position": 1,
                  "question_text": "...",
                  "option_a": "...",
                  "option_b": "...",
                  "option_c": "...",
                  "option_d": "..."
                }
              ]
            }

            Rules:
            - Generate exactly 5 questions (positions 1-5).
            - Each question must match the theme "%s".
            - Questions should help a couple understand each other better.
            - Options must be distinct and meaningful — not trivially different.
            - Do not include any text outside the JSON object.
            """.formatted(date, theme, theme);
    }

    // ── Inner response types ──────────────────────────────────────────────────

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QuestionResponse {
        private String date;
        private String theme;
        private List<QuestionItem> questions;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QuestionItem {
        private int position;

        @JsonProperty("question_text")
        private String questionText;

        @JsonProperty("option_a")
        private String optionA;

        @JsonProperty("option_b")
        private String optionB;

        @JsonProperty("option_c")
        private String optionC;

        @JsonProperty("option_d")
        private String optionD;
    }
}
