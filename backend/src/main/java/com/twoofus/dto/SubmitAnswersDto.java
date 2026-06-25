package com.twoofus.dto;

import lombok.Data;

import java.util.List;

@Data
public class SubmitAnswersDto {
    private List<String> answers;
    private List<String> notes;
}
