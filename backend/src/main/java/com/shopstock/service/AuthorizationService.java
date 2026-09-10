package com.shopstock.service;

import com.shopstock.entity.Role;
import com.shopstock.entity.User;
import com.shopstock.exception.ForbiddenException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.UUID;

@Service
public class AuthorizationService {

    private final UserRepository userRepository;

    public AuthorizationService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Loads the acting user and ensures their role is one of {@code allowed}.
     * Returns the loaded user so callers can reuse it (e.g. as performedBy)
     * instead of looking it up twice.
     */
    public User requireRole(UUID actorUserId, Role... allowed) {
        User user = userRepository.findById(actorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + actorUserId));

        if (Arrays.stream(allowed).noneMatch(role -> role == user.getRole())) {
            throw new ForbiddenException("Your role (" + user.getRole() + ") does not have permission to perform this action.");
        }

        return user;
    }

    /**
     * True if the actor's role can manage a user with the given target role,
     * per the hierarchy: Super Admin manages Admin/Seller/Compta; Admin
     * manages Seller/Compta only; nobody can create or edit a Super Admin.
     */
    public boolean canManage(Role actorRole, Role targetRole) {
        if (targetRole == Role.SUPER_ADMIN) {
            return false;
        }
        if (actorRole == Role.SUPER_ADMIN) {
            return true;
        }
        if (actorRole == Role.ADMIN) {
            return targetRole == Role.SELLER || targetRole == Role.COMPTA;
        }
        return false;
    }
}
