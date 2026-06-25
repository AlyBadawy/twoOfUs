package com.twoofus.scheduler;

import com.twoofus.service.QuestionGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@Slf4j
@RequiredArgsConstructor
public class DailyQuestionScheduler {

    private final QuestionGenerationService questionGenerationService;

    /**
     * On startup: generate today's question set if it doesn't already exist.
     * Runs asynchronously so it doesn't block the web server from accepting requests.
     * Callers will receive HTTP 202 until generation completes.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void onApplicationReady() {
        log.info("Application ready — checking for today's question set...");
        questionGenerationService.generateIfNeeded(LocalDate.now());
    }

    /**
     * Generates the next day's question set at midnight every day.
     * TODO: Configure spring.task.scheduling.time-zone in application.properties
     *       to match the couple's timezone so "midnight" is correct for them.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void generateDaily() {
        log.info("Running scheduled midnight question generation...");
        questionGenerationService.generateIfNeeded(LocalDate.now());
    }
}
