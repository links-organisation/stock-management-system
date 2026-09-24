package com.shopstock.controller;

import com.shopstock.repository.UserRepository;
import com.shopstock.support.SeededUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Only the forbidden-role path is exercised here. Calling this endpoint as an
 * authorized Super Admin schedules a real System.exit(...) ~500ms later on a
 * background thread - doing that inside this shared Spring context would kill
 * the whole Maven test JVM mid-suite, so it is deliberately never exercised
 * end-to-end in any automated test.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class SystemControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
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
    void shutdown_returns403_whenActorIsSeller() throws Exception {
        mockMvc.perform(post("/api/v1/system/shutdown").param("userId", sellerId.toString()))
                .andExpect(status().isForbidden());
    }

    @Test
    void shutdown_returns403_whenActorIsAdminButNotSuperAdmin() throws Exception {
        mockMvc.perform(post("/api/v1/system/shutdown").param("userId", adminId.toString()))
                .andExpect(status().isForbidden());
    }
}
