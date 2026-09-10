package com.shopstock.service;

import com.shopstock.dto.request.SaleItemRequest;
import com.shopstock.dto.request.SaleRequest;
import com.shopstock.dto.response.SaleResponse;
import com.shopstock.entity.*;
import com.shopstock.exception.InsufficientStockException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.InvoiceRepository;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.SaleRepository;
import com.shopstock.repository.StockOperationRepository;
import com.shopstock.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockOperationRepository stockOperationRepository;
    private final InvoiceRepository invoiceRepository;

    public SaleService(SaleRepository saleRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository,
                        StockOperationRepository stockOperationRepository,
                        InvoiceRepository invoiceRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.stockOperationRepository = stockOperationRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<SaleResponse> findAll() {
        return saleRepository.findAll().stream()
                .map(SaleResponse::new)
                .collect(Collectors.toList());
    }

    public SaleResponse findById(Long id) {
        return new SaleResponse(getEntityById(id));
    }

    Sale getEntityById(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id " + id));
    }

    @Transactional
    public SaleResponse createSale(SaleRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + request.getUserId()));

        Sale sale = new Sale();
        sale.setPerformedBy(user);
        sale.setCustomerName(request.getCustomerName());

        BigDecimal total = BigDecimal.ZERO;

        for (SaleItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + itemRequest.getProductId()));

            if (product.getQuantityInStock() < itemRequest.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for product '" + product.getName()
                        + "': requested " + itemRequest.getQuantity() + ", available " + product.getQuantityInStock());
            }

            BigDecimal subtotal = product.getSellingPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            SaleItem saleItem = new SaleItem();
            saleItem.setProduct(product);
            saleItem.setQuantity(itemRequest.getQuantity());
            saleItem.setUnitPrice(product.getSellingPrice());
            saleItem.setSubtotal(subtotal);
            sale.addItem(saleItem);

            product.setQuantityInStock(product.getQuantityInStock() - itemRequest.getQuantity());
            productRepository.save(product);

            StockOperation operation = new StockOperation();
            operation.setProduct(product);
            operation.setOperationType(OperationType.SALE);
            operation.setQuantityChange(-itemRequest.getQuantity());
            operation.setComment("Sold via sale");
            operation.setPerformedBy(user);
            stockOperationRepository.save(operation);

            total = total.add(subtotal);
        }

        sale.setTotalAmount(total);
        sale = saleRepository.save(sale);

        Invoice invoice = new Invoice();
        invoice.setSale(sale);
        invoice.setTotalAmount(sale.getTotalAmount());
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoiceRepository.save(invoice);

        return new SaleResponse(sale);
    }

    private String generateInvoiceNumber() {
        String prefix = "INV-" + Year.now().getValue() + "-";
        long count = invoiceRepository.countByInvoiceNumberStartingWith(prefix);
        return prefix + String.format("%05d", count + 1);
    }
}
