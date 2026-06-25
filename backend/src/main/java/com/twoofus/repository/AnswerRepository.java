package com.twoofus.repository;

import com.twoofus.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    Optional<Answer> findByUserIdAndQuestionSetId(Long userId, Long questionSetId);
    List<Answer> findByQuestionSetId(Long questionSetId);
    boolean existsByUserIdAndQuestionSetId(Long userId, Long questionSetId);
}
