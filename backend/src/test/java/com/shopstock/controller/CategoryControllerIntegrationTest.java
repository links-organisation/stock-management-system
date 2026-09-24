package com.shopstock.controller;

import com.shopstock.dto.request.CategoryRequest;
import com.shopstock.entity.Category;
import com.shopstock.entity.Product;
import com.shopstock.repository.CategoryRepository;
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

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class CategoryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductRepository productRepository;

    private UUID adminId;
    private UUID sellerId;

    @BeforeEach
    void lookUpSeededUsers() {
        adminId = SeededUsers.admin(userRepository).getId();
        sellerId = SeededUsers.seller(userRepository).getId();
    }

    @Test
    void create_returns201_whenAdminAndUnique() throws Exception {
        CategoryRequest request = new CategoryRequest("Dairy", "DRY", "Milk and cheese", adminId);

        mockMvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Dairy"))
                .andExpect(jsonPath("$.prefix").value("DRY"));
    }

    @Test
    void create_returns400WithFlatFieldMap_whenNameBlank() throws Exception {
        String body = "{\"name\":\"\",\"prefix\":\"DRY\",\"description\":null,\"userId\":\"%s\"}".formatted(adminId);

        mockMvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.name").exists());
    }

    @Test
    void create_returns409_whenNameAlreadyExists() throws Exception {
        CategoryRequest request = new CategoryRequest("Beverages", "NEWPFX", null, adminId);

        mockMvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void create_returns409_whenPrefixAlreadyExists() throws Exception {
        CategoryRequest request = new CategoryRequest("Brand New Name", "BEV", null, adminId);

        mockMvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void create_returns403_whenActorIsSeller() throws Exception {
        CategoryRequest request = new CategoryRequest("Dairy", "DRY", null, sellerId);

        mockMvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void delete_returns404_whenCategoryMissing() throws Exception {
        mockMvc.perform(delete("/api/v1/categories/{id}", UUID.randomUUID()).param("userId", adminId.toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_nullifiesCategoryOnProducts_thenRemovesCategory() throws Exception {
        Category category = new Category();
        category.setName("Temp Category");
        category.setPrefix("TMP");
        category = categoryRepository.save(category);

        Product product = new Product();
        product.setName("Temp Product");
        product.setReference("TMP-001");
        product.setPurchasePrice(new BigDecimal("5.00"));
        product.setSellingPrice(new BigDecimal("10.00"));
        product.setQuantityInStock(1);
        product.setAlertThreshold(0);
        product.setCategory(category);
        product = productRepository.save(product);

        mockMvc.perform(delete("/api/v1/categories/{id}", category.getId()).param("userId", adminId.toString()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/products/{id}", product.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(nullValue()));
    }

    @Test
    void getById_returns200WithBody_whenCategoryExists() throws Exception {
        Category category = new Category();
        category.setName("Frozen Foods");
        category.setPrefix("FRZ");
        category = categoryRepository.save(category);

        mockMvc.perform(get("/api/v1/categories/{id}", category.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Frozen Foods"))
                .andExpect(jsonPath("$.prefix").value("FRZ"));
    }

    @Test
    void getById_returns404_whenCategoryMissing() throws Exception {
        mockMvc.perform(get("/api/v1/categories/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_returns200WithUpdatedFields_whenCategoryExists() throws Exception {
        Category category = new Category();
        category.setName("Frozen Foods");
        category.setPrefix("FRZ");
        category = categoryRepository.save(category);
        CategoryRequest request = new CategoryRequest("Frozen & Chilled", "FRZ2", "Updated", adminId);

        mockMvc.perform(put("/api/v1/categories/{id}", category.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Frozen & Chilled"))
                .andExpect(jsonPath("$.prefix").value("FRZ2"));
    }

    @Test
    void update_returns404_whenCategoryMissing() throws Exception {
        CategoryRequest request = new CategoryRequest("Anything", "ANY", null, adminId);

        mockMvc.perform(put("/api/v1/categories/{id}", UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_succeeds_evenWhenActorIsSeller_documentedGap() throws Exception {
        // Current behavior: the update endpoint (unlike create/delete) performs no
        // role check at all, so a Seller actor can rename any category. This pins
        // down the gap at the HTTP layer, not a fix.
        Category category = new Category();
        category.setName("Frozen Foods");
        category.setPrefix("FRZ");
        category = categoryRepository.save(category);
        CategoryRequest request = new CategoryRequest("Renamed By Seller", "SEL", null, sellerId);

        mockMvc.perform(put("/api/v1/categories/{id}", category.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed By Seller"));
    }

    @Test
    void checkAvailability_name_returnsAvailableTrue_whenNameUnused() throws Exception {
        mockMvc.perform(get("/api/v1/categories/check-availability").param("column", "name").param("value", "Brand New Category"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void checkAvailability_name_returnsAvailableFalse_whenNameAlreadyUsed() throws Exception {
        mockMvc.perform(get("/api/v1/categories/check-availability").param("column", "name").param("value", "Beverages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    void checkAvailability_prefix_returnsAvailableFalse_whenPrefixAlreadyUsed() throws Exception {
        mockMvc.perform(get("/api/v1/categories/check-availability").param("column", "prefix").param("value", "BEV"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }
}
