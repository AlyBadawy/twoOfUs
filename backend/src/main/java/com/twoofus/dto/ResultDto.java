package com.twoofus.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ResultDto {
    private String status;
    private Integer score;
    private Integer totalQuestions;
    private List<ResultDetailDto> details;
}
