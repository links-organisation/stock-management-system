package com.shopstock.service;

import com.shopstock.dto.request.CategoryRequest;
import com.shopstock.dto.response.CategoryResponse;
import com.shopstock.entity.Category;
import com.shopstock.entity.Role;
import com.shopstock.entity.Product;
import com.shopstock.exception.DuplicateResourceException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.CategoryRepository;
import com.shopstock.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final AuthorizationService authorizationService;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository, AuthorizationService authorizationService) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.authorizationService = authorizationService;
    }

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponse::new)
                .collect(Collectors.toList());
    }

    public CategoryResponse create(CategoryRequest request) {
        authorizationService.requireRole(request.userId(), Role.SUPER_ADMIN, Role.ADMIN);

        categoryRepository.findByNameIgnoreCase(request.name()).ifPresent(c -> {
            throw new DuplicateResourceException("A category named '" + request.name() + "' already exists");
        });

        categoryRepository.findByPrefixIgnoreCase(request.prefix()).ifPresent(c -> {
            throw new DuplicateResourceException("A category prefixed '" + request.prefix() + "' already exists");
        });

        Category category = new Category();
        category.setName(request.name());
        category.setPrefix(request.prefix());
        category.setDescription(request.description());
        return new CategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(UUID id, UUID actorUserId) {
        authorizationService.requireRole(actorUserId, Role.SUPER_ADMIN, Role.ADMIN);
        Category category = getEntityById(id);

        List<Product> products = productRepository.findByCategoryId(id);
        products.forEach(product -> product.setCategory(null));
        productRepository.saveAll(products);

        categoryRepository.delete(category);
    }

    public Category getEntityById(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
    }
}
