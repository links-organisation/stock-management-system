package com.shopstock.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class DashboardControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void summary_returns200WithExpectedShape() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStockValue").exists())
                .andExpect(jsonPath("$.totalSalesCount").exists())
                .andExpect(jsonPath("$.revenueToday").exists())
                .andExpect(jsonPath("$.lowStockProducts").isArray())
                .andExpect(jsonPath("$.topSellingProducts").isArray());
    }
}
