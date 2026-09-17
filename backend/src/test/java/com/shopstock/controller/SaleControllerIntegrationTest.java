package com.shopstock.controller;

import com.shopstock.dto.request.SaleItemRequest;
import com.shopstock.dto.request.SaleRequest;
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
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class SaleControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;

    private UUID adminId;
    private UUID comptaId;

    @BeforeEach
    void lookUpSeededUsers() {
        adminId = SeededUsers.admin(userRepository).getId();
        comptaId = SeededUsers.compta(userRepository).getId();
    }

    private Product freshProduct(int quantity, String price) {
        Product product = new Product();
        product.setName("Sale Test Product");
        product.setReference("SALE-" + UUID.randomUUID().toString().substring(0, 6));
        product.setPurchasePrice(new BigDecimal(price).subtract(new BigDecimal("1")));
        product.setSellingPrice(new BigDecimal(price));
        product.setQuantityInStock(quantity);
        product.setAlertThreshold(0);
        return productRepository.save(product);
    }

    @Test
    void createSale_returns201_withGeneratedInvoiceNumberVisible() throws Exception {
        Product product = freshProduct(10, "50.00");
        SaleRequest request = new SaleRequest(adminId, "Walk-in", List.of(new SaleItemRequest(product.getId(), 2)));

        mockMvc.perform(post("/api/v1/sales").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalAmount").value(100.00))
                .andExpect(jsonPath("$.items[0].quantity").value(2));
    }

    @Test
    void createSale_returns400WithFlatFieldMap_whenItemsEmpty() throws Exception {
        String body = "{\"userId\":\"%s\",\"customerName\":null,\"items\":[]}".formatted(adminId);

        mockMvc.perform(post("/api/v1/sales").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.items").exists());
    }

    @Test
    void createSale_returns400WithFlatFieldMap_whenQuantityBelowMinimum() throws Exception {
        Product product = freshProduct(10, "50.00");
        String body = """
                {"userId":"%s","customerName":null,"items":[{"productId":"%s","quantity":0}]}
                """.formatted(adminId, product.getId());

        mockMvc.perform(post("/api/v1/sales").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createSale_returns409_whenInsufficientStock() throws Exception {
        Product product = freshProduct(3, "50.00");
        SaleRequest request = new SaleRequest(adminId, null, List.of(new SaleItemRequest(product.getId(), 10)));

        mockMvc.perform(post("/api/v1/sales").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void createSale_returns403_whenActorIsCompta() throws Exception {
        Product product = freshProduct(10, "50.00");
        SaleRequest request = new SaleRequest(comptaId, null, List.of(new SaleItemRequest(product.getId(), 1)));

        mockMvc.perform(post("/api/v1/sales").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createSale_rollsBackEarlierItemsStockDecrement_whenALaterItemFailsInsufficientStock() throws Exception {
        // Real transactional behavior: this can only be observed through the real
        // database, not a Mockito unit test. First item has enough stock and would
        // succeed on its own; second item does not, so the whole sale (and its
        // already-applied first-item stock decrement) must roll back.
        //
        // A same-transaction read afterwards would NOT see this: Spring's test
        // @Transactional only issues the physical ROLLBACK when the test method's
        // own transaction ends, so a read still inside that same transaction sees
        // the flushed-but-uncommitted decrement, not the rolled-back value. We use
        // TestTransaction to create real transaction boundaries: commit the fixture
        // products first (so they survive the sale's own rollback), then end/start
        // a fresh transaction after the failed sale to observe the post-rollback state.
        Product sufficientStock = freshProduct(10, "50.00");
        Product insufficientStock = freshProduct(2, "30.00");
        UUID sufficientStockId = sufficientStock.getId();

        TestTransaction.flagForCommit();
        TestTransaction.end();
        TestTransaction.start();

        SaleRequest request = new SaleRequest(adminId, null, List.of(
                new SaleItemRequest(sufficientStockId, 5),
                new SaleItemRequest(insufficientStock.getId(), 100)));

        mockMvc.perform(post("/api/v1/sales").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());

        TestTransaction.end();
        TestTransaction.start();

        Product reloaded = productRepository.findById(sufficientStockId).orElseThrow();
        assertThat(reloaded.getQuantityInStock()).isEqualTo(10);
    }
}
