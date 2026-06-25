package com.twoofus.controller;

import com.twoofus.dto.UserDto;
import com.twoofus.entity.User;
import com.twoofus.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final CurrentUserService currentUserService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> me() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(
            UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build()
        );
    }
}
