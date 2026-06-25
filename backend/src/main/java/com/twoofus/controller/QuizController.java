package com.twoofus.controller;

import com.twoofus.dto.*;
import com.twoofus.entity.Answer;
import com.twoofus.entity.Question;
import com.twoofus.entity.QuestionSet;
import com.twoofus.entity.User;
import com.twoofus.repository.AnswerRepository;
import com.twoofus.repository.QuestionRepository;
import com.twoofus.repository.QuestionSetRepository;
import com.twoofus.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class QuizController {

    private final CurrentUserService currentUserService;
    private final QuestionSetRepository questionSetRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    @GetMapping("/today")
    public ResponseEntity<?> getToday() {
        currentUserService.getCurrentUser(); // upsert user on every authenticated call

        return questionSetRepository.findBySetDate(LocalDate.now())
            .<ResponseEntity<?>>map(qs -> {
                List<Question> questions =
                    questionRepository.findByQuestionSetIdOrderByPosition(qs.getId());

                QuestionSetDto dto = QuestionSetDto.builder()
                    .id(qs.getId())
                    .date(qs.getSetDate().toString())
                    .theme(qs.getTheme())
                    .questions(questions.stream()
                        .map(q -> QuestionDto.builder()
                            .id(q.getId())
                            .position(q.getPosition())
                            .questionText(q.getQuestionText())
                            .optionA(q.getOptionA())
                            .optionB(q.getOptionB())
                            .optionC(q.getOptionC())
                            .optionD(q.getOptionD())
                            .build())
                        .collect(Collectors.toList()))
                    .build();

                return ResponseEntity.ok(dto);
            })
            .orElseGet(() ->
                ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(Map.of("status", "generating"))
            );
    }

    @Transactional
    @PostMapping("/today/submit")
    public ResponseEntity<?> submitAnswers(@RequestBody SubmitAnswersDto dto) {
        User currentUser = currentUserService.getCurrentUser();

        QuestionSet questionSet = questionSetRepository.findBySetDate(LocalDate.now())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "No question set available for today yet"));

        if (answerRepository.existsByUserIdAndQuestionSetId(currentUser.getId(), questionSet.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("status", "already_submitted",
                             "message", "You have already submitted answers for today"));
        }

        List<String> answers = dto.getAnswers();
        if (answers == null || answers.size() != 5) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Exactly 5 answers are required"));
        }
        for (String a : answers) {
            if (a == null || !a.matches("[ABCD]")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Each answer must be one of: A, B, C, D"));
            }
        }

        answerRepository.save(
            Answer.builder()
                .user(currentUser)
                .questionSet(questionSet)
                .answer1(answers.get(0))
                .answer2(answers.get(1))
                .answer3(answers.get(2))
                .answer4(answers.get(3))
                .answer5(answers.get(4))
                .build()
        );

        return ResponseEntity.ok(Map.of("status", "submitted"));
    }

    @GetMapping("/today/result")
    public ResponseEntity<?> getResult() {
        User currentUser = currentUserService.getCurrentUser();

        QuestionSet questionSet = questionSetRepository.findBySetDate(LocalDate.now())
            .orElse(null);

        if (questionSet == null) {
            return ResponseEntity.ok(Map.of("status", "waiting"));
        }

        List<Answer> allAnswers = answerRepository.findByQuestionSetId(questionSet.getId());

        Answer myAnswer = allAnswers.stream()
            .filter(a -> a.getUser().getId().equals(currentUser.getId()))
            .findFirst()
            .orElse(null);

        if (myAnswer == null) {
            return ResponseEntity.notFound().build();
        }

        Answer partnerAnswer = allAnswers.stream()
            .filter(a -> !a.getUser().getId().equals(currentUser.getId()))
            .findFirst()
            .orElse(null);

        if (partnerAnswer == null) {
            return ResponseEntity.ok(Map.of("status", "waiting"));
        }

        List<Question> questions =
            questionRepository.findByQuestionSetIdOrderByPosition(questionSet.getId());

        String[] myAnswers = {
            myAnswer.getAnswer1(), myAnswer.getAnswer2(), myAnswer.getAnswer3(),
            myAnswer.getAnswer4(), myAnswer.getAnswer5()
        };
        String[] partnerAnswers = {
            partnerAnswer.getAnswer1(), partnerAnswer.getAnswer2(), partnerAnswer.getAnswer3(),
            partnerAnswer.getAnswer4(), partnerAnswer.getAnswer5()
        };

        int score = 0;
        List<ResultDetailDto> details = new ArrayList<>();

        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            String mine = myAnswers[i];
            String theirs = partnerAnswers[i];
            boolean match = mine.equals(theirs);
            if (match) score++;

            details.add(ResultDetailDto.builder()
                .position(q.getPosition())
                .questionText(q.getQuestionText())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .myAnswer(mine)
                .partnerAnswer(theirs)
                .match(match)
                .build());
        }

        return ResponseEntity.ok(
            ResultDto.builder()
                .status("revealed")
                .date(questionSet.getSetDate().toString())
                .theme(questionSet.getTheme())
                .score(score)
                .totalQuestions(5)
                .details(details)
                .build()
        );
    }
}
