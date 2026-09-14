package com.shopstock.service;

import com.shopstock.dto.request.AdjustmentRequest;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.entity.*;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.StockOperationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final StockOperationRepository stockOperationRepository;
    private final AuthorizationService authorizationService;

    public InventoryService(ProductRepository productRepository,
                            StockOperationRepository stockOperationRepository,
                            AuthorizationService authorizationService) {
        this.productRepository = productRepository;
        this.stockOperationRepository = stockOperationRepository;
        this.authorizationService = authorizationService;
    }

    @Transactional
    public ProductResponse adjust(AdjustmentRequest request) {
        User user = authorizationService.requireRole(request.userId(), Role.SUPER_ADMIN, Role.ADMIN);

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + request.productId()));

        int delta = request.newQuantity() - product.getQuantityInStock();
        product.setQuantityInStock(request.newQuantity());
        productRepository.save(product);

        if (delta != 0) {
            StockOperation operation = new StockOperation();
            operation.setProduct(product);
            operation.setOperationType(OperationType.ADJUSTMENT);
            operation.setQuantityChange(delta);
            operation.setComment(request.comment());
            operation.setPerformedBy(user);
            stockOperationRepository.save(operation);
        }

        return new ProductResponse(product);
    }
}
