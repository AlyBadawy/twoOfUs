package com.twoofus.controller;

import com.twoofus.dto.ResultDetailDto;
import com.twoofus.dto.ResultDto;
import com.twoofus.dto.WeekDayDto;
import com.twoofus.entity.Answer;
import com.twoofus.entity.Question;
import com.twoofus.entity.QuestionSet;
import com.twoofus.entity.User;
import com.twoofus.repository.AnswerRepository;
import com.twoofus.repository.QuestionRepository;
import com.twoofus.repository.QuestionSetRepository;
import com.twoofus.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final CurrentUserService currentUserService;
    private final QuestionSetRepository questionSetRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    @GetMapping("/week")
    public List<WeekDayDto> getWeek(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        User me = currentUserService.getCurrentUser();
        LocalDate anchor = (date != null) ? date : LocalDate.now();
        LocalDate weekStart = anchor.with(DayOfWeek.MONDAY);
        LocalDate today = LocalDate.now();

        List<WeekDayDto> week = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            week.add(buildDayDto(weekStart.plusDays(i), me, today));
        }
        return week;
    }

    @GetMapping("/month")
    public List<WeekDayDto> getMonth(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        User me = currentUserService.getCurrentUser();
        LocalDate anchor = (date != null) ? date : LocalDate.now();
        LocalDate firstDay = anchor.withDayOfMonth(1);
        LocalDate lastDay = anchor.withDayOfMonth(anchor.lengthOfMonth());
        LocalDate today = LocalDate.now();

        List<WeekDayDto> result = new ArrayList<>();
        for (LocalDate d = firstDay; !d.isAfter(lastDay); d = d.plusDays(1)) {
            result.add(buildDayDto(d, me, today));
        }
        return result;
    }

    @GetMapping("/{date}")
    public ResultDto getDayResult(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        if (date.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No result for a future date");
        }

        User me = currentUserService.getCurrentUser();

        QuestionSet qs = questionSetRepository.findBySetDate(date)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No questions for " + date));

        List<Answer> answers = answerRepository.findByQuestionSetId(qs.getId());

        Answer myAnswer = answers.stream()
                .filter(a -> a.getUser().getId().equals(me.getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "You did not answer on " + date));

        Answer partnerAnswer = answers.stream()
                .filter(a -> !a.getUser().getId().equals(me.getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partner did not answer on " + date));

        List<Question> questions = questionRepository.findByQuestionSetIdOrderByPosition(qs.getId());

        String[] mine         = { myAnswer.getAnswer1(), myAnswer.getAnswer2(), myAnswer.getAnswer3(), myAnswer.getAnswer4(), myAnswer.getAnswer5() };
        String[] theirs       = { partnerAnswer.getAnswer1(), partnerAnswer.getAnswer2(), partnerAnswer.getAnswer3(), partnerAnswer.getAnswer4(), partnerAnswer.getAnswer5() };
        String[] myNotes      = { myAnswer.getNotes1(), myAnswer.getNotes2(), myAnswer.getNotes3(), myAnswer.getNotes4(), myAnswer.getNotes5() };
        String[] partnerNotes = { partnerAnswer.getNotes1(), partnerAnswer.getNotes2(), partnerAnswer.getNotes3(), partnerAnswer.getNotes4(), partnerAnswer.getNotes5() };

        int score = 0;
        List<ResultDetailDto> details = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            boolean match = mine[i].equals(theirs[i]);
            if (match) score++;
            details.add(ResultDetailDto.builder()
                    .position(q.getPosition())
                    .questionText(q.getQuestionText())
                    .optionA(q.getOptionA())
                    .optionB(q.getOptionB())
                    .optionC(q.getOptionC())
                    .optionD(q.getOptionD())
                    .myAnswer(mine[i])
                    .partnerAnswer(theirs[i])
                    .match(match)
                    .myNote(myNotes[i])
                    .partnerNote(partnerNotes[i])
                    .build());
        }

        return ResultDto.builder()
                .status("revealed")
                .date(qs.getSetDate().toString())
                .theme(qs.getTheme())
                .score(score)
                .totalQuestions(5)
                .details(details)
                .build();
    }

    private WeekDayDto buildDayDto(LocalDate day, User me, LocalDate today) {
        if (day.isAfter(today)) {
            return new WeekDayDto(day.toString(), false, true, false, false, null, null);
        }
        Optional<QuestionSet> qs = questionSetRepository.findBySetDate(day);
        if (qs.isEmpty()) {
            return new WeekDayDto(day.toString(), false, false, false, false, null, null);
        }
        List<Answer> answers = answerRepository.findByQuestionSetId(qs.get().getId());
        boolean mySubmitted      = answers.stream().anyMatch(a ->  a.getUser().getId().equals(me.getId()));
        boolean partnerSubmitted = answers.stream().anyMatch(a -> !a.getUser().getId().equals(me.getId()));
        Integer score = null;
        if (mySubmitted && partnerSubmitted) {
            Answer mine    = answers.stream().filter(a ->  a.getUser().getId().equals(me.getId())).findFirst().get();
            Answer partner = answers.stream().filter(a -> !a.getUser().getId().equals(me.getId())).findFirst().get();
            score = calcScore(mine, partner);
        }
        return new WeekDayDto(day.toString(), true, false, mySubmitted, partnerSubmitted, score, 5);
    }

    private int calcScore(Answer a, Answer b) {
        int s = 0;
        if (a.getAnswer1().equals(b.getAnswer1())) s++;
        if (a.getAnswer2().equals(b.getAnswer2())) s++;
        if (a.getAnswer3().equals(b.getAnswer3())) s++;
        if (a.getAnswer4().equals(b.getAnswer4())) s++;
        if (a.getAnswer5().equals(b.getAnswer5())) s++;
        return s;
    }
}
