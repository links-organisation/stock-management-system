package com.shopstock.service;

import com.shopstock.dto.request.CreateUserRequest;
import com.shopstock.dto.request.SelfUpdateRequest;
import com.shopstock.dto.request.UpdateUserRequest;
import com.shopstock.dto.response.UserResponse;
import com.shopstock.entity.Role;
import com.shopstock.entity.User;
import com.shopstock.exception.DuplicateResourceException;
import com.shopstock.exception.ForbiddenException;
import com.shopstock.exception.InvalidCredentialsException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;

    public UserService(UserRepository userRepository, AuthorizationService authorizationService) {
        this.userRepository = userRepository;
        this.authorizationService = authorizationService;
    }

    public List<UserResponse> findAll(UUID actorUserId) {
        authorizationService.requireRole(actorUserId, Role.SUPER_ADMIN, Role.ADMIN);
        return userRepository.findAllByOrderByUsernameAsc().stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
    }

    public UserResponse create(CreateUserRequest request) {
        User actor = authorizationService.requireRole(request.getActorUserId(), Role.SUPER_ADMIN, Role.ADMIN);

        if (!authorizationService.canManage(actor.getRole(), request.getRole())) {
            throw new ForbiddenException("Role " + actor.getRole() + " is not allowed to create a " + request.getRole() + " account.");
        }

        userRepository.findByUsername(request.getUsername()).ifPresent(u -> {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken.");
        });

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(BCrypt.hashpw(request.getPassword(), BCrypt.gensalt()));
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());

        return new UserResponse(userRepository.save(user));
    }

    public UserResponse update(UUID targetId, UpdateUserRequest request) {
        User actor = authorizationService.requireRole(request.getActorUserId(), Role.SUPER_ADMIN, Role.ADMIN);
        User target = getEntityById(targetId);

        if (!authorizationService.canManage(actor.getRole(), target.getRole())) {
            throw new ForbiddenException("Role " + actor.getRole() + " is not allowed to edit a " + target.getRole() + " account.");
        }

        if (request.getRole() != null && !authorizationService.canManage(actor.getRole(), request.getRole())) {
            throw new ForbiddenException("Role " + actor.getRole() + " is not allowed to assign the " + request.getRole() + " role.");
        }

        if (request.getUsername() != null && !request.getUsername().equals(target.getUsername())) {
            userRepository.findByUsername(request.getUsername()).ifPresent(u -> {
                throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken.");
            });
            target.setUsername(request.getUsername());
        }
        if (request.getFullName() != null) {
            target.setFullName(request.getFullName());
        }
        if (request.getPassword() != null) {
            target.setPassword(BCrypt.hashpw(request.getPassword(), BCrypt.gensalt()));
        }
        if (request.getRole() != null) {
            target.setRole(request.getRole());
        }

        return new UserResponse(userRepository.save(target));
    }

    public UserResponse updateSelf(SelfUpdateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + request.getUserId()));

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            userRepository.findByUsername(request.getUsername()).ifPresent(u -> {
                throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken.");
            });
            user.setUsername(request.getUsername());
        }
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getNewPassword() != null) {
            if (request.getCurrentPassword() == null
                    || !BCrypt.checkpw(request.getCurrentPassword(), user.getPassword())) {
                throw new InvalidCredentialsException("Current password is incorrect.");
            }
            user.setPassword(BCrypt.hashpw(request.getNewPassword(), BCrypt.gensalt()));
        }

        return new UserResponse(userRepository.save(user));
    }

    private User getEntityById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }
}
