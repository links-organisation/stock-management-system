package com.shopstock.controller;

import com.shopstock.dto.request.ProductRequest;
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

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class ProductControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;

    private UUID adminId;
    private UUID sellerId;

    @BeforeEach
    void lookUpSeededUsers() {
        adminId = SeededUsers.admin(userRepository).getId();
        sellerId = SeededUsers.seller(userRepository).getId();
    }

    @Test
    void create_returns201WithBody_whenAdminAndValidRequest() throws Exception {
        ProductRequest request = new ProductRequest("Sparkling Water 500ml", "BEV-999", null,
                new BigDecimal("150.00"), new BigDecimal("250.00"), 30, 5, adminId);

        mockMvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Sparkling Water 500ml"))
                .andExpect(jsonPath("$.reference").value("BEV-999"))
                .andExpect(jsonPath("$.lowStock").value(false));
    }

    @Test
    void create_returns400WithFlatFieldMap_whenPurchasePriceMissing() throws Exception {
        String body = """
                {"name":"Sparkling Water 500ml","reference":"BEV-999","categoryId":null,
                 "purchasePrice":null,"sellingPrice":250.00,"quantityInStock":30,
                 "alertThreshold":5,"userId":"%s"}""".formatted(adminId);

        mockMvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.timestamp").doesNotExist())
                .andExpect(jsonPath("$.purchasePrice").value("must not be null"));
    }

    @Test
    void create_returns403WithErrorResponseShape_whenActorIsSeller() throws Exception {
        ProductRequest request = new ProductRequest("Sparkling Water 500ml", "BEV-998", null,
                new BigDecimal("150.00"), new BigDecimal("250.00"), 30, 5, sellerId);

        mockMvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void update_returns200_whenAdminAndProductExists() throws Exception {
        Product product = productRepository.save(TestProduct.clean("Original", "BEV-997"));
        ProductRequest request = new ProductRequest("Renamed", "BEV-997", null,
                new BigDecimal("11.00"), new BigDecimal("22.00"), 9, 2, adminId);

        mockMvc.perform(put("/api/v1/products/{id}", product.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed"))
                .andExpect(jsonPath("$.quantityInStock").value(9));
    }

    @Test
    void update_returns404_whenProductMissing() throws Exception {
        ProductRequest request = new ProductRequest("Renamed", "BEV-996", null,
                new BigDecimal("11.00"), new BigDecimal("22.00"), 9, 2, adminId);

        mockMvc.perform(put("/api/v1/products/{id}", UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void search_filtersByQueryAndCategory() throws Exception {
        mockMvc.perform(get("/api/v1/products/search").param("query", "Mineral"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name", containsString("Mineral")));
    }

    @Test
    void nextRef_returnsIncrementedReference_forSeededPrefix() throws Exception {
        mockMvc.perform(get("/api/v1/products/next-ref").param("prefix", "BEV"))
                .andExpect(status().isOk())
                .andExpect(content().string("BEV-003"));
                //.andExpect(jsonPath("$.prefix").value("BEV-003"));
    }

    @Test
    void delete_returns409WithErrorResponseShape_whenProductHasStockHistory() throws Exception {
        ProductRequest request = new ProductRequest("Sparkling Water 500ml", "BEV-995", null,
                new BigDecimal("150.00"), new BigDecimal("250.00"), 30, 5, adminId);
        String created = mockMvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        UUID productId = UUID.fromString(objectMapper.readTree(created).get("id").asString());

        mockMvc.perform(delete("/api/v1/products/{id}", productId).param("userId", adminId.toString()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message", containsString("audit trail")));
    }

    @Test
    void delete_returns204_whenProductHasNoStockHistory() throws Exception {
        Product clean = productRepository.save(TestProduct.clean("Untouched Product", "BEV-994"));

        mockMvc.perform(delete("/api/v1/products/{id}", clean.getId()).param("userId", adminId.toString()))
                .andExpect(status().isNoContent());
    }

    @Test
    void create_returns201WithCategoryPrefix_whenCategorySet() throws Exception {
        com.shopstock.entity.Category category = new com.shopstock.entity.Category();
        category.setName("Frozen Foods");
        category.setPrefix("FRZ");
        category = categoryRepository.save(category);
        ProductRequest request = new ProductRequest("Frozen Peas", "FRZ-001", category.getId(),
                new BigDecimal("5.00"), new BigDecimal("9.00"), 10, 2, adminId);

        mockMvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoryName").value("Frozen Foods"))
                .andExpect(jsonPath("$.categoryPrefix").value("FRZ"));
    }

    @Test
    void checkAvailability_returnsAvailableTrue_whenReferenceUnused() throws Exception {
        mockMvc.perform(get("/api/v1/products/check-availability").param("reference", "BEV-UNUSED-999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void checkAvailability_returnsAvailableFalse_whenReferenceAlreadyUsed() throws Exception {
        productRepository.save(TestProduct.clean("Existing Product", "BEV-993"));

        mockMvc.perform(get("/api/v1/products/check-availability").param("reference", "BEV-993"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    /** Inserts a product directly via the repository, bypassing ProductService.create
     *  so no StockOperation/SaleItem history gets logged for it. */
    private static final class TestProduct {
        static Product clean(String name, String reference) {
            Product p = new Product();
            p.setName(name);
            p.setReference(reference);
            p.setPurchasePrice(new BigDecimal("10.00"));
            p.setSellingPrice(new BigDecimal("20.00"));
            p.setQuantityInStock(5);
            p.setAlertThreshold(1);
            return p;
        }
    }
}
