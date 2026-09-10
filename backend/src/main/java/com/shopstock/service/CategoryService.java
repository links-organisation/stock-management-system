package com.shopstock.service;

import com.shopstock.dto.request.CategoryRequest;
import com.shopstock.dto.response.CategoryResponse;
import com.shopstock.entity.Category;
import com.shopstock.entity.Role;
import com.shopstock.exception.DuplicateResourceException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final AuthorizationService authorizationService;

    public CategoryService(CategoryRepository categoryRepository, AuthorizationService authorizationService) {
        this.categoryRepository = categoryRepository;
        this.authorizationService = authorizationService;
    }

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponse::new)
                .collect(Collectors.toList());
    }

    public CategoryResponse create(CategoryRequest request) {
        authorizationService.requireRole(request.getUserId(), Role.SUPER_ADMIN, Role.ADMIN);

        categoryRepository.findByNameIgnoreCase(request.getName()).ifPresent(c -> {
            throw new DuplicateResourceException("A category named '" + request.getName() + "' already exists");
        });

        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        return new CategoryResponse(categoryRepository.save(category));
    }

    public Category getEntityById(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
    }
}
