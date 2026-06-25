package com.twoofus.service;

import com.twoofus.entity.Question;
import com.twoofus.entity.QuestionSet;
import com.twoofus.repository.QuestionRepository;
import com.twoofus.repository.QuestionSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Slf4j
@RequiredArgsConstructor
public class QuestionGenerationService {

    private final QuestionSetRepository questionSetRepository;
    private final QuestionRepository questionRepository;
    private final ClaudeService claudeService;

    private static final String[] THEMES = {
        "Love Language & Vulnerability",
        "Physical intimacy & Affection",
        "Conflict & Communication",
        "Quality Time & Long Distance",
        "Future & Shared Life",
        "Trust & Security",
        "Personality & Relationship Style"
    };

    @Transactional
    public void generateIfNeeded(LocalDate date) {
        if (questionSetRepository.existsBySetDate(date)) {
            log.info("Question set for {} already exists — skipping generation", date);
            return;
        }

        String theme = themeForDate(date);
        log.info("Generating question set for {} — theme: {}", date, theme);

        ClaudeService.QuestionResponse response = claudeService.generateQuestions(date, theme);

        QuestionSet questionSet = questionSetRepository.save(
            QuestionSet.builder()
                .setDate(date)
                .theme(theme)
                .build()
        );

        for (ClaudeService.QuestionItem item : response.getQuestions()) {
            questionRepository.save(
                Question.builder()
                    .questionSet(questionSet)
                    .position(item.getPosition())
                    .questionText(item.getQuestionText())
                    .optionA(item.getOptionA())
                    .optionB(item.getOptionB())
                    .optionC(item.getOptionC())
                    .optionD(item.getOptionD())
                    .build()
            );
        }

        log.info("Successfully generated question set id={} for {} (theme: {})",
            questionSet.getId(), date, theme);
    }

    private String themeForDate(LocalDate date) {
        // Cycle through the 7 themes based on day-of-year so each calendar day
        // consistently maps to the same theme regardless of when the app runs.
        int index = (date.getDayOfYear() - 1) % THEMES.length;
        return THEMES[index];
    }
}
