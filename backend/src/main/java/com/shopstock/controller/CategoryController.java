package com.shopstock.controller;

import com.shopstock.dto.request.CategoryRequest;
import com.shopstock.dto.response.CategoryResponse;
import com.shopstock.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(categoryService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    @PutMapping("{id}")
    public ResponseEntity<CategoryResponse> update(@RequestBody CategoryRequest request, @PathVariable UUID id) {
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @GetMapping(value = "/check-availability")
    public Map<String, Boolean> checkAvailability(@RequestParam String column, @RequestParam String value) {
        return Map.of("available", categoryService.checkAvailability(column, value));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @RequestParam UUID userId) {
        categoryService.delete(id, userId);
    }
}
