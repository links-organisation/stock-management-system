package com.shopstock.service;

import com.shopstock.entity.Role;
import com.shopstock.entity.User;
import com.shopstock.exception.ForbiddenException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    @Mock
    private UserRepository userRepository;

    private AuthorizationService authorizationService;

    @BeforeEach
    void setUp() {
        authorizationService = new AuthorizationService(userRepository);
    }

    @Test
    void requireRole_throwsNotFound_whenActorDoesNotExist() {
        UUID missingId = UUID.randomUUID();
        when(userRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authorizationService.requireRole(missingId, Role.ADMIN))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void requireRole_returnsUser_whenRoleIsAllowed() {
        UUID actorId = UUID.randomUUID();
        User user = new User();
        user.setId(actorId);
        user.setRole(Role.ADMIN);
        when(userRepository.findById(actorId)).thenReturn(Optional.of(user));

        User result = authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN);

        assertThat(result).isSameAs(user);
    }

    @Test
    void requireRole_throwsForbidden_whenRoleNotInAllowedSet() {
        UUID actorId = UUID.randomUUID();
        User user = new User();
        user.setId(actorId);
        user.setRole(Role.SELLER);
        when(userRepository.findById(actorId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN))
                .isInstanceOf(ForbiddenException.class);
    }

    @ParameterizedTest(name = "{0} managing {1} -> {2}")
    @CsvSource({
            "SUPER_ADMIN, ADMIN,       true",
            "SUPER_ADMIN, SELLER,      true",
            "SUPER_ADMIN, COMPTA,      true",
            "SUPER_ADMIN, SUPER_ADMIN, false",
            "ADMIN,       SELLER,      true",
            "ADMIN,       COMPTA,      true",
            "ADMIN,       ADMIN,       false",
            "ADMIN,       SUPER_ADMIN, false",
            "SELLER,      SELLER,      false",
            "SELLER,      COMPTA,      false",
            "SELLER,      ADMIN,       false",
            "COMPTA,      SELLER,      false",
            "COMPTA,      COMPTA,      false",
    })
    void canManage_matchesHierarchyMatrix(Role actorRole, Role targetRole, boolean expected) {
        assertThat(authorizationService.canManage(actorRole, targetRole)).isEqualTo(expected);
    }
}
