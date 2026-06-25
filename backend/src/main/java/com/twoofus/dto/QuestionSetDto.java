package com.twoofus.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuestionSetDto {
    private Long id;
    private String date;
    private String theme;
    private List<QuestionDto> questions;
}
