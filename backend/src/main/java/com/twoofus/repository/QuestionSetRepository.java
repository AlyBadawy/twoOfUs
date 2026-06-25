package com.twoofus.repository;

import com.twoofus.entity.QuestionSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, Long> {
    Optional<QuestionSet> findBySetDate(LocalDate setDate);
    boolean existsBySetDate(LocalDate setDate);
}
