package com.shopstock.controller;

import com.shopstock.dto.request.ProductRequest;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAll() {
        return ResponseEntity.ok(productService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>> search(@RequestParam(required = false) String query, @RequestParam(required = false) UUID categoryId) {
        return ResponseEntity.ok(productService.search(query, categoryId));
    }

    @GetMapping(value = "/next-ref", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getNextRef(@RequestParam String prefix) {
        return ResponseEntity.ok(productService.findNextRef(prefix));
    }

    @GetMapping(value = "/check-availability")
    public Map<String, Boolean> checkRefAvailability(@RequestParam String reference) {
        return Map.of("available", productService.checkRefAvailability(reference));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @RequestParam UUID userId) {
        productService.delete(id, userId);
    }
}
