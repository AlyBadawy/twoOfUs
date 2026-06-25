package com.twoofus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "answers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_set_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_set_id", nullable = false)
    private QuestionSet questionSet;

    @Column(name = "answer_1", nullable = false, length = 1)
    private String answer1;

    @Column(name = "answer_2", nullable = false, length = 1)
    private String answer2;

    @Column(name = "answer_3", nullable = false, length = 1)
    private String answer3;

    @Column(name = "answer_4", nullable = false, length = 1)
    private String answer4;

    @Column(name = "answer_5", nullable = false, length = 1)
    private String answer5;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;
}
