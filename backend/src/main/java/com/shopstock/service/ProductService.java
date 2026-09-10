package com.shopstock.service;

import com.shopstock.dto.request.ProductRequest;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.entity.Category;
import com.shopstock.entity.OperationType;
import com.shopstock.entity.Product;
import com.shopstock.entity.StockOperation;
import com.shopstock.entity.User;
import com.shopstock.exception.DuplicateResourceException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.StockOperationRepository;
import com.shopstock.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockOperationRepository stockOperationRepository;
    private final CategoryService categoryService;

    public ProductService(ProductRepository productRepository,
                           UserRepository userRepository,
                           StockOperationRepository stockOperationRepository,
                           CategoryService categoryService) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.stockOperationRepository = stockOperationRepository;
        this.categoryService = categoryService;
    }

    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream()
                .map(ProductResponse::new)
                .collect(Collectors.toList());
    }

    public ProductResponse findById(Long id) {
        return new ProductResponse(getEntityById(id));
    }

    public List<ProductResponse> search(String query, Long categoryId) {
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
        productRepository.findByReference(request.getReference()).ifPresent(p -> {
            throw new DuplicateResourceException("A product with reference '" + request.getReference() + "' already exists");
        });

        User user = getUserOrThrow(request.getUserId());

        Product product = new Product();
        applyRequest(product, request);
        product = productRepository.save(product);

        logStockOperation(product, OperationType.REGISTRATION, product.getQuantityInStock(),
                "Initial stock on product registration", user);

        return new ProductResponse(product);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getEntityById(id);
        User user = getUserOrThrow(request.getUserId());

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

    public void delete(Long id) {
        Product product = getEntityById(id);
        productRepository.delete(product);
    }

    Product getEntityById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setReference(request.getReference());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setQuantityInStock(request.getQuantityInStock());
        product.setAlertThreshold(request.getAlertThreshold());
        if (request.getCategoryId() != null) {
            Category category = categoryService.getEntityById(request.getCategoryId());
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

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
    }
}
