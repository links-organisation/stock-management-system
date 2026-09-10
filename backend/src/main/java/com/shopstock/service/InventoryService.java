package com.shopstock.service;

import com.shopstock.dto.request.AdjustmentRequest;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.entity.OperationType;
import com.shopstock.entity.Product;
import com.shopstock.entity.StockOperation;
import com.shopstock.entity.User;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.StockOperationRepository;
import com.shopstock.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockOperationRepository stockOperationRepository;

    public InventoryService(ProductRepository productRepository,
                             UserRepository userRepository,
                             StockOperationRepository stockOperationRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.stockOperationRepository = stockOperationRepository;
    }

    @Transactional
    public ProductResponse adjust(AdjustmentRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + request.getProductId()));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + request.getUserId()));

        int delta = request.getNewQuantity() - product.getQuantityInStock();
        product.setQuantityInStock(request.getNewQuantity());
        productRepository.save(product);

        if (delta != 0) {
            StockOperation operation = new StockOperation();
            operation.setProduct(product);
            operation.setOperationType(OperationType.ADJUSTMENT);
            operation.setQuantityChange(delta);
            operation.setComment(request.getComment());
            operation.setPerformedBy(user);
            stockOperationRepository.save(operation);
        }

        return new ProductResponse(product);
    }
}
