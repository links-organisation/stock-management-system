package com.shopstock.service;

import com.shopstock.dto.request.LoginRequest;
import com.shopstock.dto.response.UserResponse;
import com.shopstock.entity.Role;
import com.shopstock.entity.User;
import com.shopstock.exception.InvalidCredentialsException;
import com.shopstock.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository);
    }

    @Test
    void login_returnsUser_whenCredentialsAreCorrect() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("admin");
        user.setPassword(BCrypt.hashpw("admin123", BCrypt.gensalt()));
        user.setFullName("Shop Administrator");
        user.setRole(Role.SUPER_ADMIN);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        UserResponse response = authService.login(new LoginRequest("admin", "admin123"));

        assertThat(response.username()).isEqualTo("admin");
        assertThat(response.role()).isEqualTo(Role.SUPER_ADMIN);
    }

    @Test
    void login_throwsInvalidCredentials_whenUsernameUnknown() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost", "whatever")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid username or password");
    }

    @Test
    void login_throwsInvalidCredentials_whenPasswordWrong() {
        User user = new User();
        user.setUsername("admin");
        user.setPassword(BCrypt.hashpw("admin123", BCrypt.gensalt()));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("admin", "wrongpassword")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid username or password");
    }

    @Test
    void login_unknownUsernameAndWrongPassword_produceIdenticalMessage_enumerationSafe() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());
        User user = new User();
        user.setUsername("admin");
        user.setPassword(BCrypt.hashpw("admin123", BCrypt.gensalt()));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        String unknownUserMessage = catchMessage(() -> authService.login(new LoginRequest("ghost", "x")));
        String wrongPasswordMessage = catchMessage(() -> authService.login(new LoginRequest("admin", "wrong")));

        assertThat(unknownUserMessage).isEqualTo(wrongPasswordMessage);
    }

    private String catchMessage(Runnable action) {
        try {
            action.run();
            throw new AssertionError("Expected InvalidCredentialsException but none was thrown");
        } catch (InvalidCredentialsException ex) {
            return ex.getMessage();
        }
    }
}
