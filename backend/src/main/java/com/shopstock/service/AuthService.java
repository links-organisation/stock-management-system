package com.shopstock.service;

import com.shopstock.dto.request.LoginRequest;
import com.shopstock.dto.response.UserResponse;
import com.shopstock.entity.User;
import com.shopstock.exception.InvalidCredentialsException;
import com.shopstock.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (!BCrypt.checkpw(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        return new UserResponse(user.getId(), user.getUsername(), user.getFullName());
    }
}
