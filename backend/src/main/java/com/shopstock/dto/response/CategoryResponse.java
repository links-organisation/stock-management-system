package com.shopstock.dto.response;

import com.shopstock.entity.Category;

import java.util.UUID;

public record CategoryResponse(UUID id, String name, String prefix, String description) {
    public CategoryResponse(Category category) {
        this(category.getId(), category.getName(), category.getPrefix(), category.getDescription());
    }
}
