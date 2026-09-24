package com.shopstock.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class NetworkControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getNetworkInfo_returns200WithExpectedShape() throws Exception {
        // Runs against this machine's real network interfaces, so only the shape
        // (not exact IPs, which vary per environment) is asserted here.
        mockMvc.perform(get("/api/v1/network/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.https").value(false))
                .andExpect(jsonPath("$.port").isNumber())
                .andExpect(jsonPath("$.addresses").isArray());
    }
}
