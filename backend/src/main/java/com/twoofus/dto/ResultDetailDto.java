package com.twoofus.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResultDetailDto {
    private int position;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String myAnswer;
    private String partnerAnswer;
    private boolean match;
    private String myNote;
    private String partnerNote;
}
