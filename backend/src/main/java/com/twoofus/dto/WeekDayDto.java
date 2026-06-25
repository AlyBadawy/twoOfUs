package com.twoofus.dto;

public record WeekDayDto(
    String date,
    boolean hasQuestions,
    boolean isFuture,
    boolean mySubmitted,
    boolean partnerSubmitted,
    Integer score,
    Integer totalQuestions
) {}
