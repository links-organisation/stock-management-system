package com.shopstock.dto.response;

import com.shopstock.entity.Category;

import java.util.UUID;

public record CategoryResponse(UUID id, String name, String description) {
    public CategoryResponse(Category category) {
        this(category.getId(), category.getName(), category.getDescription());
    }
}
