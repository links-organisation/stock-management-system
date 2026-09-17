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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class InventoryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;

    private UUID adminId;
    private UUID sellerId;

    @BeforeEach
    void lookUpSeededUsers() {
        adminId = SeededUsers.admin(userRepository).getId();
        sellerId = SeededUsers.seller(userRepository).getId();
    }

    private Product freshProduct(int quantity) {
        Product product = new Product();
        product.setName("Inventory Test Product");
        product.setReference("INV-" + UUID.randomUUID().toString().substring(0, 6));
        product.setPurchasePrice(new BigDecimal("5.00"));
        product.setSellingPrice(new BigDecimal("10.00"));
        product.setQuantityInStock(quantity);
        product.setAlertThreshold(1);
        return productRepository.save(product);
    }

    @Test
    void adjust_returns200_withUpdatedQuantity() throws Exception {
        Product product = freshProduct(10);
        AdjustmentRequest request = new AdjustmentRequest(product.getId(), 25, "recount", adminId);

        mockMvc.perform(post("/api/v1/inventory/adjust").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantityInStock").value(25));
    }

    @Test
    void adjust_returns400WithFlatFieldMap_whenNewQuantityMissing() throws Exception {
        Product product = freshProduct(10);
        String body = "{\"productId\":\"%s\",\"newQuantity\":null,\"comment\":null,\"userId\":\"%s\"}"
                .formatted(product.getId(), adminId);

        mockMvc.perform(post("/api/v1/inventory/adjust").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.newQuantity").exists());
    }

    @Test
    void adjust_returns404_whenProductMissing() throws Exception {
        AdjustmentRequest request = new AdjustmentRequest(UUID.randomUUID(), 10, null, adminId);

        mockMvc.perform(post("/api/v1/inventory/adjust").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void adjust_returns403_whenActorIsSeller() throws Exception {
        Product product = freshProduct(10);
        AdjustmentRequest request = new AdjustmentRequest(product.getId(), 25, null, sellerId);

        mockMvc.perform(post("/api/v1/inventory/adjust").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
