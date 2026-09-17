package com.shopstock.support;

import com.shopstock.dto.request.CategoryRequest;
import com.shopstock.dto.request.ProductRequest;
import com.shopstock.entity.Category;
import com.shopstock.entity.Product;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Small static-factory helpers to cut boilerplate across test classes.
 * Deliberately not a fluent/generic builder framework - just factories with
 * sane defaults, plus a uniqueness suffix so repeated calls within one test
 * (or across tests sharing the cached context) don't collide on unique
 * columns (name/reference/prefix/username).
 */
public final class TestFixtures {

    private TestFixtures() {
    }

    public static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    public static ProductRequest productRequest(UUID userId) {
        return new ProductRequest(unique("Product"), unique("REF"), null,
                new BigDecimal("100.00"), new BigDecimal("150.00"), 20, 5, userId);
    }

    public static ProductRequest productRequest(UUID userId, UUID categoryId) {
        return new ProductRequest(unique("Product"), unique("REF"), categoryId,
                new BigDecimal("100.00"), new BigDecimal("150.00"), 20, 5, userId);
    }

    public static CategoryRequest categoryRequest(UUID userId) {
        return new CategoryRequest(unique("Category"), unique("PFX"), "desc", userId);
    }

    public static Category category(String name, String prefix) {
        Category c = new Category();
        c.setName(name);
        c.setPrefix(prefix);
        return c;
    }

    public static Product product(String name, String reference, int quantity, int alertThreshold) {
        Product p = new Product();
        p.setName(name);
        p.setReference(reference);
        p.setPurchasePrice(new BigDecimal("10.00"));
        p.setSellingPrice(new BigDecimal("20.00"));
        p.setQuantityInStock(quantity);
        p.setAlertThreshold(alertThreshold);
        return p;
    }
}
