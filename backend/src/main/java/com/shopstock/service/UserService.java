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
        User actor = authorizationService.requireRole(request.actorUserId(), Role.SUPER_ADMIN, Role.ADMIN);

        if (!authorizationService.canManage(actor.getRole(), request.role())) {
            throw new ForbiddenException("Role " + actor.getRole() + " is not allowed to create a " + request.role() + " account.");
        }

        userRepository.findByUsername(request.username()).ifPresent(u -> {
            throw new DuplicateResourceException("Username '" + request.username() + "' is already taken.");
        });

        User user = new User();
        user.setUsername(request.username());
        user.setPassword(BCrypt.hashpw(request.password(), BCrypt.gensalt()));
        user.setFullName(request.fullName());
        user.setRole(request.role());

        return new UserResponse(userRepository.save(user));
    }

    public UserResponse update(UUID targetId, UpdateUserRequest request) {
        User actor = authorizationService.requireRole(request.actorUserId(), Role.SUPER_ADMIN, Role.ADMIN);
        User target = getEntityById(targetId);

        if (!authorizationService.canManage(actor.getRole(), target.getRole())) {
            throw new ForbiddenException("Role " + actor.getRole() + " is not allowed to edit a " + target.getRole() + " account.");
        }

        if (request.role() != null && !authorizationService.canManage(actor.getRole(), request.role())) {
            throw new ForbiddenException("Role " + actor.getRole() + " is not allowed to assign the " + request.role() + " role.");
        }

        if (request.username() != null && !request.username().equals(target.getUsername())) {
            userRepository.findByUsername(request.username()).ifPresent(u -> {
                throw new DuplicateResourceException("Username '" + request.username() + "' is already taken.");
            });
            target.setUsername(request.username());
        }
        if (request.fullName() != null) {
            target.setFullName(request.fullName());
        }
        if (request.password() != null) {
            target.setPassword(BCrypt.hashpw(request.password(), BCrypt.gensalt()));
        }
        if (request.role() != null) {
            target.setRole(request.role());
        }

        return new UserResponse(userRepository.save(target));
    }

    public UserResponse updateSelf(SelfUpdateRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + request.userId()));

        if (request.username() != null && !request.username().equals(user.getUsername())) {
            userRepository.findByUsername(request.username()).ifPresent(u -> {
                throw new DuplicateResourceException("Username '" + request.username() + "' is already taken.");
            });
            user.setUsername(request.username());
        }
        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }
        if (request.newPassword() != null) {
            if (request.currentPassword() == null
                    || !BCrypt.checkpw(request.currentPassword(), user.getPassword())) {
                throw new InvalidCredentialsException("Current password is incorrect.");
            }
            user.setPassword(BCrypt.hashpw(request.newPassword(), BCrypt.gensalt()));
        }

        return new UserResponse(userRepository.save(user));
    }

    private User getEntityById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }
}
