package com.shopstock.dto.response;

import com.shopstock.entity.Category;

import java.util.UUID;

public class CategoryResponse {

    private final UUID id;
    private final String name;
    private final String description;

    public CategoryResponse(Category category) {
        this.id = category.getId();
        this.name = category.getName();
        this.description = category.getDescription();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
