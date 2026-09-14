package com.shopstock.service;

import com.shopstock.dto.request.ProductRequest;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.entity.*;
import com.shopstock.exception.DuplicateResourceException;
import com.shopstock.exception.ProductInUseException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.SaleItemRepository;
import com.shopstock.repository.StockOperationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final StockOperationRepository stockOperationRepository;
    private final SaleItemRepository saleItemRepository;
    private final CategoryService categoryService;
    private final AuthorizationService authorizationService;

    public ProductService(ProductRepository productRepository,
                          StockOperationRepository stockOperationRepository,
                          SaleItemRepository saleItemRepository,
                          CategoryService categoryService,
                          AuthorizationService authorizationService) {
        this.productRepository = productRepository;
        this.stockOperationRepository = stockOperationRepository;
        this.saleItemRepository = saleItemRepository;
        this.categoryService = categoryService;
        this.authorizationService = authorizationService;
    }

    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream()
                .map(ProductResponse::new)
                .collect(Collectors.toList());
    }

    public ProductResponse findById(UUID id) {
        return new ProductResponse(getEntityById(id));
    }

    public List<ProductResponse> search(String query, UUID categoryId) {
        List<Product> base = categoryId != null
                ? productRepository.findByCategoryId(categoryId)
                : productRepository.findAll();

        return base.stream()
                .filter(p -> query == null || query.isBlank()
                        || p.getName().toLowerCase().contains(query.toLowerCase())
                        || p.getReference().toLowerCase().contains(query.toLowerCase()))
                .map(ProductResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        User user = authorizationService.requireRole(request.userId(), Role.SUPER_ADMIN, Role.ADMIN);

        productRepository.findByReference(request.reference()).ifPresent(p -> {
            throw new DuplicateResourceException("A product with reference '" + request.reference() + "' already exists");
        });

        Product product = new Product();
        applyRequest(product, request);
        product = productRepository.save(product);

        logStockOperation(product, OperationType.REGISTRATION, product.getQuantityInStock(),
                "Initial stock on product registration", user);

        return new ProductResponse(product);
    }

    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {
        User user = authorizationService.requireRole(request.userId(), Role.SUPER_ADMIN, Role.ADMIN);
        Product product = getEntityById(id);

        int previousQuantity = product.getQuantityInStock();
        applyRequest(product, request);
        product = productRepository.save(product);

        int delta = product.getQuantityInStock() - previousQuantity;
        if (delta != 0) {
            logStockOperation(product, OperationType.REGISTRATION, delta,
                    "Stock updated via product edit", user);
        }

        return new ProductResponse(product);
    }

    public void delete(UUID id, UUID actorUserId) {
        authorizationService.requireRole(actorUserId, Role.SUPER_ADMIN, Role.ADMIN);
        Product product = getEntityById(id);

        if (stockOperationRepository.existsByProductId(id) || saleItemRepository.existsByProductId(id)) {
            throw new ProductInUseException("Cannot delete '" + product.getName()
                    + "' because it has recorded stock history or sales. Products with activity are kept for the audit trail.");
        }

        productRepository.delete(product);
    }

    Product getEntityById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setReference(request.reference());
        product.setPurchasePrice(request.purchasePrice());
        product.setSellingPrice(request.sellingPrice());
        product.setQuantityInStock(request.quantityInStock());
        product.setAlertThreshold(request.alertThreshold());
        if (request.categoryId() != null) {
            Category category = categoryService.getEntityById(request.categoryId());
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }
    }

    private void logStockOperation(Product product, OperationType type, int quantityChange, String comment, User user) {
        StockOperation operation = new StockOperation();
        operation.setProduct(product);
        operation.setOperationType(type);
        operation.setQuantityChange(quantityChange);
        operation.setComment(comment);
        operation.setPerformedBy(user);
        stockOperationRepository.save(operation);
    }
}
