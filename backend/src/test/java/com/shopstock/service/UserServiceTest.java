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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AuthorizationService authorizationService;

    private UserService userService;
    private final UUID actorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, authorizationService);
    }

    private User user(UUID id, Role role) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setUsername("existing");
        user.setPassword(BCrypt.hashpw("secret123", BCrypt.gensalt()));
        return user;
    }

    // --- findAll ---

    @Test
    void findAll_throwsForbidden_whenActorNotAdmin() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN))
                .thenThrow(new ForbiddenException("nope"));

        assertThatThrownBy(() -> userService.findAll(actorId)).isInstanceOf(ForbiddenException.class);
    }

    // --- create ---

    @Test
    void create_throwsForbidden_whenActorRoleNotAllowed() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN))
                .thenThrow(new ForbiddenException("nope"));

        assertThatThrownBy(() -> userService.create(
                new CreateUserRequest(actorId, "newbie", "pw123456", "New Guy", Role.SELLER)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void create_throwsForbidden_whenAdminTriesToCreateAnotherAdmin() {
        User admin = user(actorId, Role.ADMIN);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(admin);
        when(authorizationService.canManage(Role.ADMIN, Role.ADMIN)).thenReturn(false);

        assertThatThrownBy(() -> userService.create(
                new CreateUserRequest(actorId, "newadmin", "pw123456", "New Admin", Role.ADMIN)))
                .isInstanceOf(ForbiddenException.class);
        verifyNoInteractions(userRepository);
    }

    @Test
    void create_succeeds_whenAdminCreatesSeller() {
        User admin = user(actorId, Role.ADMIN);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(admin);
        when(authorizationService.canManage(Role.ADMIN, Role.SELLER)).thenReturn(true);
        when(userRepository.findByUsername("newseller")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserResponse response = userService.create(
                new CreateUserRequest(actorId, "newseller", "pw123456", "New Seller", Role.SELLER));

        assertThat(response.username()).isEqualTo("newseller");
        assertThat(response.role()).isEqualTo(Role.SELLER);
    }

    @Test
    void create_succeeds_whenSuperAdminCreatesAdmin() {
        User superAdmin = user(actorId, Role.SUPER_ADMIN);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(superAdmin);
        when(authorizationService.canManage(Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(true);
        when(userRepository.findByUsername("newadmin")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.create(
                new CreateUserRequest(actorId, "newadmin", "pw123456", "New Admin", Role.ADMIN));

        assertThat(response.role()).isEqualTo(Role.ADMIN);
    }

    @Test
    void create_throwsDuplicate_whenUsernameTaken() {
        User admin = user(actorId, Role.ADMIN);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(admin);
        when(authorizationService.canManage(Role.ADMIN, Role.SELLER)).thenReturn(true);
        when(userRepository.findByUsername("taken")).thenReturn(Optional.of(new User()));

        assertThatThrownBy(() -> userService.create(
                new CreateUserRequest(actorId, "taken", "pw123456", "Someone", Role.SELLER)))
                .isInstanceOf(DuplicateResourceException.class);
        verify(userRepository, never()).save(any());
    }

    // --- update ---

    @Test
    void update_throwsNotFound_whenTargetMissing() {
        UUID missingId = UUID.randomUUID();
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(user(actorId, Role.ADMIN));
        when(userRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.update(missingId, new UpdateUserRequest(actorId, null, null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_throwsForbidden_whenActorCannotManageTargetsCurrentRole() {
        UUID targetId = UUID.randomUUID();
        User admin = user(actorId, Role.ADMIN);
        User targetAdmin = user(targetId, Role.ADMIN);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(admin);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetAdmin));
        when(authorizationService.canManage(Role.ADMIN, Role.ADMIN)).thenReturn(false);

        assertThatThrownBy(() -> userService.update(targetId, new UpdateUserRequest(actorId, null, null, "New Name", null)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void update_throwsForbidden_whenActorCannotAssignNewRequestedRole() {
        UUID targetId = UUID.randomUUID();
        User admin = user(actorId, Role.ADMIN);
        User targetSeller = user(targetId, Role.SELLER);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(admin);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetSeller));
        when(authorizationService.canManage(Role.ADMIN, Role.SELLER)).thenReturn(true);
        when(authorizationService.canManage(Role.ADMIN, Role.ADMIN)).thenReturn(false);

        assertThatThrownBy(() -> userService.update(targetId, new UpdateUserRequest(actorId, null, null, null, Role.ADMIN)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void update_skipsUsernameUniquenessCheck_whenUsernameUnchanged() {
        UUID targetId = UUID.randomUUID();
        User admin = user(actorId, Role.ADMIN);
        User target = user(targetId, Role.SELLER);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(admin);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));
        when(authorizationService.canManage(Role.ADMIN, Role.SELLER)).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.update(targetId, new UpdateUserRequest(actorId, "existing", null, "Renamed", null));

        verify(userRepository, never()).findByUsername(any());
    }

    @Test
    void update_appliesOnlyProvidedFields_partialUpdate() {
        UUID targetId = UUID.randomUUID();
        User admin = user(actorId, Role.ADMIN);
        User target = user(targetId, Role.SELLER);
        target.setFullName("Original Name");
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(admin);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));
        when(authorizationService.canManage(Role.ADMIN, Role.SELLER)).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.update(targetId, new UpdateUserRequest(actorId, null, null, "New Name", null));

        assertThat(response.username()).isEqualTo("existing");
        assertThat(response.role()).isEqualTo(Role.SELLER);
    }

    // --- updateSelf ---

    @Test
    void updateSelf_hasNoRoleCheck_anySeededUserCanCallIt() {
        User seller = user(actorId, Role.SELLER);
        when(userRepository.findById(actorId)).thenReturn(Optional.of(seller));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateSelf(new SelfUpdateRequest(actorId, null, "New Name", null, null));

        verifyNoInteractions(authorizationService);
    }

    @Test
    void updateSelf_throwsNotFound_whenSelfMissing() {
        UUID missingId = UUID.randomUUID();
        when(userRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateSelf(new SelfUpdateRequest(missingId, null, null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateSelf_throwsInvalidCredentials_whenCurrentPasswordWrong() {
        User self = user(actorId, Role.SELLER);
        when(userRepository.findById(actorId)).thenReturn(Optional.of(self));

        assertThatThrownBy(() -> userService.updateSelf(
                new SelfUpdateRequest(actorId, null, null, "wrongpassword", "newpassword1")))
                .isInstanceOf(InvalidCredentialsException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateSelf_changesPassword_whenCurrentPasswordCorrect() {
        User self = user(actorId, Role.SELLER);
        when(userRepository.findById(actorId)).thenReturn(Optional.of(self));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateSelf(new SelfUpdateRequest(actorId, null, null, "secret123", "newpassword1"));

        assertThat(BCrypt.checkpw("newpassword1", self.getPassword())).isTrue();
    }

    @Test
    void updateSelf_roleIsUnaffected_sinceSelfUpdateRequestHasNoRoleField() {
        User self = user(actorId, Role.SELLER);
        when(userRepository.findById(actorId)).thenReturn(Optional.of(self));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.updateSelf(new SelfUpdateRequest(actorId, null, "Renamed", null, null));

        assertThat(response.role()).isEqualTo(Role.SELLER);
    }
}
