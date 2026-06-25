package com.twoofus.service;

import com.twoofus.entity.User;
import com.twoofus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    /**
     * Extracts claims from the JWT in the SecurityContext, then upserts the user
     * in the database and returns the resolved entity.
     */
    @Transactional
    public User getCurrentUser() {
        JwtAuthenticationToken auth =
            (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = auth.getToken();

        String sub = jwt.getSubject();
        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");

        try {
            return userRepository.findBySub(sub)
                .map(existing -> {
                    boolean dirty = false;
                    if (!Objects.equals(existing.getUsername(), username)) {
                        existing.setUsername(username);
                        dirty = true;
                    }
                    if (!Objects.equals(existing.getEmail(), email)) {
                        existing.setEmail(email);
                        dirty = true;
                    }
                    return dirty ? userRepository.save(existing) : existing;
                })
                .orElseGet(() -> userRepository.save(
                    User.builder()
                        .sub(sub)
                        .username(username)
                        .email(email)
                        .build()
                ));
        } catch (DataIntegrityViolationException e) {
            // Two concurrent requests for a brand-new user both saw no row and both
            // tried to insert — the loser re-fetches the row the winner just created.
            return userRepository.findBySub(sub)
                .orElseThrow(() -> new RuntimeException("Failed to upsert user: " + sub, e));
        }
    }
}
