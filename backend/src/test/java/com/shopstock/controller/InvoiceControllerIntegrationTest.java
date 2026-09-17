package com.shopstock.controller;

import com.shopstock.dto.request.SaleItemRequest;
import com.shopstock.dto.request.SaleRequest;
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

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class InvoiceControllerIntegrationTest {

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

    @Test
    void getAll_returns200WithList() throws Exception {
        mockMvc.perform(get("/api/v1/invoices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getById_returns404_whenInvoiceMissing() throws Exception {
        mockMvc.perform(get("/api/v1/invoices/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getById_returns200WithSaleDetail_afterASaleCreatesAnInvoice() throws Exception {
        UUID productId = productRepository.findAll().get(0).getId();
        SaleRequest saleRequest = new SaleRequest(adminId, "Test Customer", List.of(new SaleItemRequest(productId, 1)));
        String saleBody = mockMvc.perform(post("/api/v1/sales").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saleRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID saleId = UUID.fromString(objectMapper.readTree(saleBody).get("id").asText());

        mockMvc.perform(get("/api/v1/invoices"))
                .andExpect(status().isOk());

        // Find the invoice created for this sale via the list endpoint, then fetch it.
        String listBody = mockMvc.perform(get("/api/v1/invoices"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var invoices = objectMapper.readTree(listBody);
        UUID invoiceId = null;
        for (var node : invoices) {
            if (node.get("saleId").asText().equals(saleId.toString())) {
                invoiceId = UUID.fromString(node.get("id").asText());
            }
        }

        mockMvc.perform(get("/api/v1/invoices/{id}", invoiceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sale.customerName").value("Test Customer"))
                .andExpect(jsonPath("$.sale.items").isArray());
    }
}
