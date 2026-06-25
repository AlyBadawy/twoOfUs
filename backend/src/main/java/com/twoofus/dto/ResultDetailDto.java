package com.twoofus.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResultDetailDto {
    private int position;
    private String questionText;
    private String myAnswer;
    private String partnerAnswer;
    private boolean match;
}
