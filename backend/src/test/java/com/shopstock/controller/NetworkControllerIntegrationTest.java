package com.shopstock.controller;

import com.shopstock.dto.response.NetworkInfo;
import com.shopstock.service.CertificateService;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Uses its own isolated @TempDir-backed certificates directory (via @DynamicPropertySource,
 * which forces Spring Test to build a fresh context for this class rather than reusing the
 * suite's shared cached one) so seeding a real certificate here can never affect the
 * $.https/$.certificateValid assertions in other test classes sharing the default context.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Transactional
class NetworkControllerIntegrationTest {

    @TempDir
    private static Path certificatesDir;

    @DynamicPropertySource
    static void certificatesDirProperty(DynamicPropertyRegistry registry) {
        registry.add("application.certificates.dir", () -> certificatesDir.toString());
        // Prevents TomcatHttpsConnectorConfig's customizer from eagerly generating a
        // certificate at context startup (it still runs against the mock web server
        // factory bean even under WebEnvironment.MOCK), which would leave a cert already
        // present before getCertificate_returns404ThenReturns200_onceGenerated's first assertion.
        registry.add("application.https.enabled", () -> "false");
    }

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private CertificateService certificateService;
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getNetworkInfo_returns200WithExpectedShape() throws Exception {
        // Runs against this machine's real network interfaces, so only the shape
        // (not exact IPs, which vary per environment) is asserted here.
        mockMvc.perform(get("/api/v1/network/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.https").isBoolean())
                .andExpect(jsonPath("$.certificateValid").isBoolean())
                .andExpect(jsonPath("$.port").isNumber())
                .andExpect(jsonPath("$.addresses").isArray());
    }

    @Test
    void getCertificate_returns404ThenReturns200_onceGenerated() throws Exception {
        mockMvc.perform(get("/api/v1/network/certificate"))
                .andExpect(status().isNotFound());

        certificateService.ensureHttpsReady();

        mockMvc.perform(get("/api/v1/network/certificate"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/x-pem-file"))
                .andExpect(content().string(startsWith("-----BEGIN CERTIFICATE-----")));
    }

    @Test
    void getQrCode_returns400_whenUrlIsNotACurrentNetworkAddress() throws Exception {
        mockMvc.perform(get("/api/v1/network/qrcode").param("url", "http://example.com/not-a-real-address"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getQrCode_returns200WithPngImage_whenUrlIsACurrentNetworkAddress() throws Exception {
        // Runs against this machine's real network interfaces; skipped in environments
        // (e.g. sandboxed CI) with no eligible LAN address to build a valid QR request from.
        String body = mockMvc.perform(get("/api/v1/network/info"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        NetworkInfo info = objectMapper.readValue(body, NetworkInfo.class);
        Assumptions.assumeFalse(info.addresses().isEmpty(), "No LAN address detected on this machine");
        String url = info.addresses().getFirst().url();

        byte[] png = mockMvc.perform(get("/api/v1/network/qrcode").param("url", url))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(png).isNotEmpty();
        assertThat(png[0]).isEqualTo((byte) 0x89);
        assertThat(png[1]).isEqualTo((byte) 'P');
        assertThat(png[2]).isEqualTo((byte) 'N');
        assertThat(png[3]).isEqualTo((byte) 'G');
    }
}
