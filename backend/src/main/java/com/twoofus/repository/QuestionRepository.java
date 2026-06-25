package com.twoofus.repository;

import com.twoofus.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByQuestionSetIdOrderByPosition(Long questionSetId);
}
