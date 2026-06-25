package com.twoofus.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestionDto {
    private Long id;
    private int position;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
}
