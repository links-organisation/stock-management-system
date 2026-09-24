package com.shopstock.service;

import com.shopstock.entity.Role;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class SystemService {

    private final AuthorizationService authorizationService;
    private final ConfigurableApplicationContext applicationContext;

    public SystemService(AuthorizationService authorizationService, ConfigurableApplicationContext applicationContext) {
        this.authorizationService = authorizationService;
        this.applicationContext = applicationContext;
    }

    /**
     * Gracefully shuts down the whole application. Restricted to Super Admin.
     * Runs the actual exit on a short delay, off the request thread, so the
     * HTTP response reaches the caller before the JVM goes down.
     */
    public void shutdown(UUID actorUserId) {
        authorizationService.requireRole(actorUserId, Role.SUPER_ADMIN);

        Executors.newSingleThreadScheduledExecutor().schedule(
                () -> System.exit(SpringApplication.exit(applicationContext, () -> 0)),
                500,
                TimeUnit.MILLISECONDS
        );
    }
}
