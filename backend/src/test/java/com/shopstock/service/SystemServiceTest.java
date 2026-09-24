package com.shopstock.service;

import com.shopstock.exception.ForbiddenException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ConfigurableApplicationContext;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Only the forbidden-role path is exercised here. The success path calls
 * System.exit(...) on a background thread shortly after returning - actually
 * reaching it in a test would kill the whole Maven test JVM mid-suite, so it
 * is deliberately never invoked with an authorized actor in any automated test.
 */
@ExtendWith(MockitoExtension.class)
class SystemServiceTest {

    @Mock
    private AuthorizationService authorizationService;
    @Mock
    private ConfigurableApplicationContext applicationContext;

    private final UUID actorId = UUID.randomUUID();

    @Test
    void shutdown_throwsForbidden_whenActorIsNotSuperAdmin_andNeverTouchesTheApplicationContext() {
        SystemService systemService = new SystemService(authorizationService, applicationContext);
        when(authorizationService.requireRole(actorId, com.shopstock.entity.Role.SUPER_ADMIN))
                .thenThrow(new ForbiddenException("Your role does not have permission to perform this action."));

        assertThatThrownBy(() -> systemService.shutdown(actorId))
                .isInstanceOf(ForbiddenException.class);
        verifyNoInteractions(applicationContext);
    }
}
