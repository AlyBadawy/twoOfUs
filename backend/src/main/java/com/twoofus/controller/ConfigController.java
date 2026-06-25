package com.twoofus.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${oidc.client.authority}")
    private String authority;

    @Value("${oidc.client.client-id}")
    private String clientId;

    @Value("${oidc.client.redirect-uri}")
    private String redirectUri;

    @GetMapping
    public Map<String, String> getConfig() {
        return Map.of(
            "authority",   authority,
            "clientId",    clientId,
            "redirectUri", redirectUri
        );
    }
}
