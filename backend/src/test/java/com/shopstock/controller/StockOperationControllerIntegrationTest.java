package com.shopstock.controller;

import com.shopstock.dto.request.AdjustmentRequest;
import com.shopstock.entity.Product;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.UserRepository;
import com.shopstock.support.SeededUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class StockOperationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;

    private UUID adminId;

    @BeforeEach
    void lookUpSeededUsers() {
        adminId = SeededUsers.admin(userRepository).getId();
    }

    // Note: DataSeeder inserts its demo products directly via ProductRepository,
    // bypassing ProductService, so it never logs a StockOperation for them - there
    // is nothing seeded to query here. These tests create their own REGISTRATION
    // op through the real POST /products endpoint instead.

    @Test
    void getAll_noFilters_returnsNonEmptyList_afterAProductIsRegistered() throws Exception {
        registerProduct();

        mockMvc.perform(get("/api/v1/stock-operations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.not(org.hamcrest.Matchers.empty())));
    }

    @Test
    void getAll_filtersByType() throws Exception {
        registerProduct();

        mockMvc.perform(get("/api/v1/stock-operations").param("type", "REGISTRATION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].operationType").value("REGISTRATION"));
    }

    private void registerProduct() throws Exception {
        String body = """
                {"name":"Stock Op Test Product","reference":"SOTP-%s","categoryId":null,
                 "purchasePrice":5.00,"sellingPrice":10.00,"quantityInStock":10,
                 "alertThreshold":1,"userId":"%s"}""".formatted(UUID.randomUUID().toString().substring(0, 6), adminId);
        mockMvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void getAll_filtersByProductId_afterAnAdjustment() throws Exception {
        Product product = new Product();
        product.setName("Filter Test Product");
        product.setReference("FILT-" + UUID.randomUUID().toString().substring(0, 6));
        product.setPurchasePrice(new BigDecimal("5.00"));
        product.setSellingPrice(new BigDecimal("10.00"));
        product.setQuantityInStock(10);
        product.setAlertThreshold(1);
        product = productRepository.save(product);

        AdjustmentRequest request = new AdjustmentRequest(product.getId(), 20, "test adjust", adminId);
        mockMvc.perform(post("/api/v1/inventory/adjust").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/stock-operations").param("productId", product.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].productId").value(product.getId().toString()))
                .andExpect(jsonPath("$[0].operationType").value("ADJUSTMENT"));
    }

    @Test
    void getAll_dateRangeFilter_excludesOperationsOutsideRange() throws Exception {
        mockMvc.perform(get("/api/v1/stock-operations")
                        .param("from", java.time.LocalDate.now().plusDays(1).toString())
                        .param("to", java.time.LocalDate.now().plusDays(2).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.empty()));
    }
}
