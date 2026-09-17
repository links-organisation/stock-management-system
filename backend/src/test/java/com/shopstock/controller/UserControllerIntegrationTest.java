package com.shopstock.controller;

import com.shopstock.dto.request.CreateUserRequest;
import com.shopstock.dto.request.SelfUpdateRequest;
import com.shopstock.dto.request.UpdateUserRequest;
import com.shopstock.entity.Role;
import com.shopstock.entity.User;
import com.shopstock.repository.UserRepository;
import com.shopstock.support.SeededUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;

    private UUID adminId;
    private UUID sellerId;

    @BeforeEach
    void lookUpSeededUsers() {
        adminId = SeededUsers.admin(userRepository).getId();
        sellerId = SeededUsers.seller(userRepository).getId();
    }

    @Test
    void getAll_returns200_forAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/users").param("actorUserId", adminId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getAll_returns403_forNonAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/users").param("actorUserId", sellerId.toString()))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_returns201_whenAdminCreatesSeller() throws Exception {
        CreateUserRequest request = new CreateUserRequest(adminId, "newseller1", "pw123456", "New Seller", Role.SELLER);

        mockMvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newseller1"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void create_returns403_whenAdminTriesToCreateAnotherAdmin_canManageFailure() throws Exception {
        CreateUserRequest request = new CreateUserRequest(adminId, "newadmin1", "pw123456", "New Admin", Role.ADMIN);

        mockMvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("not allowed to create")));
    }

    @Test
    void create_returns403_whenActorRoleNotAllowedAtAll_roleCheckFailure() throws Exception {
        CreateUserRequest request = new CreateUserRequest(sellerId, "newseller2", "pw123456", "New Seller", Role.SELLER);

        mockMvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("does not have permission")));
    }

    @Test
    void create_returns409_whenUsernameTaken() throws Exception {
        CreateUserRequest request = new CreateUserRequest(adminId, "seller", "pw123456", "Duplicate", Role.SELLER);

        mockMvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    private User freshSeller() {
        User user = new User();
        user.setUsername("target-" + UUID.randomUUID().toString().substring(0, 8));
        user.setPassword(BCrypt.hashpw("secret123", BCrypt.gensalt()));
        user.setFullName("Target User");
        user.setRole(Role.SELLER);
        return userRepository.save(user);
    }

    @Test
    void update_returns200_withPartialUpdate() throws Exception {
        User target = freshSeller();
        UpdateUserRequest request = new UpdateUserRequest(adminId, null, null, "Renamed Target", null);

        mockMvc.perform(put("/api/v1/users/{id}", target.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Renamed Target"))
                .andExpect(jsonPath("$.username").value(target.getUsername()));
    }

    @Test
    void update_returns404_whenTargetMissing() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest(adminId, null, null, "Doesn't matter", null);

        mockMvc.perform(put("/api/v1/users/{id}", UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_returns403_whenAdminTriesToAssignAdminRole() throws Exception {
        User target = freshSeller();
        UpdateUserRequest request = new UpdateUserRequest(adminId, null, null, null, Role.ADMIN);

        mockMvc.perform(put("/api/v1/users/{id}", target.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateSelf_returns200_whenPasswordChangeWithCorrectCurrentPassword() throws Exception {
        SelfUpdateRequest request = new SelfUpdateRequest(sellerId, null, null, "seller123", "newpassword1");

        mockMvc.perform(put("/api/v1/users/me").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void updateSelf_returns401_whenCurrentPasswordWrong() throws Exception {
        SelfUpdateRequest request = new SelfUpdateRequest(sellerId, null, null, "wrongpassword", "newpassword1");

        mockMvc.perform(put("/api/v1/users/me").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
