package com.shopstock.service;

import com.shopstock.dto.request.CategoryRequest;
import com.shopstock.dto.response.CategoryResponse;
import com.shopstock.entity.Category;
import com.shopstock.entity.Product;
import com.shopstock.entity.Role;
import com.shopstock.entity.User;
import com.shopstock.exception.DuplicateResourceException;
import com.shopstock.exception.ForbiddenException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.CategoryRepository;
import com.shopstock.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private AuthorizationService authorizationService;

    private CategoryService categoryService;
    private final UUID actorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository, productRepository, authorizationService);
    }

    @Test
    void create_savesCategory_whenActorIsAdminAndNamesAreUnique() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(new User());
        when(categoryRepository.findByNameIgnoreCase("Beverages")).thenReturn(Optional.empty());
        when(categoryRepository.findByPrefixIgnoreCase("BEV")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CategoryResponse response = categoryService.create(new CategoryRequest("Beverages", "BEV", "Drinks", actorId));

        assertThat(response.name()).isEqualTo("Beverages");
        assertThat(response.prefix()).isEqualTo("BEV");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void create_throwsDuplicate_whenNameAlreadyExists() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(new User());
        when(categoryRepository.findByNameIgnoreCase("Beverages")).thenReturn(Optional.of(new Category()));

        assertThatThrownBy(() -> categoryService.create(new CategoryRequest("Beverages", "BEV", null, actorId)))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Beverages");
        verify(categoryRepository, never()).save(any());
        verify(categoryRepository, never()).findByPrefixIgnoreCase(any());
    }

    @Test
    void create_throwsDuplicate_whenPrefixAlreadyExists() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(new User());
        when(categoryRepository.findByNameIgnoreCase("Snacks")).thenReturn(Optional.empty());
        when(categoryRepository.findByPrefixIgnoreCase("BEV")).thenReturn(Optional.of(new Category()));

        assertThatThrownBy(() -> categoryService.create(new CategoryRequest("Snacks", "BEV", null, actorId)))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("BEV");
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void create_throwsForbidden_whenActorRoleNotAllowed() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN))
                .thenThrow(new ForbiddenException("Your role does not have permission to perform this action."));

        assertThatThrownBy(() -> categoryService.create(new CategoryRequest("Snacks", "SNK", null, actorId)))
                .isInstanceOf(ForbiddenException.class);
        verifyNoInteractions(categoryRepository);
    }

    @Test
    void delete_throwsNotFound_whenCategoryMissing() {
        UUID missingId = UUID.randomUUID();
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(new User());
        when(categoryRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.delete(missingId, actorId))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(productRepository, never()).findByCategoryId(any());
    }

    @Test
    void delete_nullifiesCategoryOnReferencingProducts_thenDeletesCategory() {
        UUID categoryId = UUID.randomUUID();
        Category category = new Category();
        category.setId(categoryId);
        Product p1 = new Product();
        p1.setId(UUID.randomUUID());
        p1.setCategory(category);
        Product p2 = new Product();
        p2.setId(UUID.randomUUID());
        p2.setCategory(category);

        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(new User());
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(productRepository.findByCategoryId(categoryId)).thenReturn(List.of(p1, p2));

        categoryService.delete(categoryId, actorId);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Product>> captor = ArgumentCaptor.forClass(List.class);
        verify(productRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2).allSatisfy(p -> assertThat(p.getCategory()).isNull());
        verify(categoryRepository).delete(category);
    }
}
