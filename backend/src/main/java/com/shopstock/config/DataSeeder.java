package com.shopstock.config;

import com.shopstock.entity.Category;
import com.shopstock.entity.Product;
import com.shopstock.entity.User;
import com.shopstock.repository.CategoryRepository;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public DataSeeder(UserRepository userRepository,
                       CategoryRepository categoryRepository,
                       ProductRepository productRepository) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(BCrypt.hashpw("admin123", BCrypt.gensalt()));
            admin.setFullName("Shop Administrator");
            userRepository.save(admin);
        }

        if (categoryRepository.count() == 0) {
            Category beverages = save(categoryRepository, "Beverages", "Drinks and refreshments");
            Category snacks = save(categoryRepository, "Snacks", "Chips, biscuits and other snacks");

            if (productRepository.count() == 0) {
                createProduct("Mineral Water 1L", "BEV-001", beverages, "0.50", "1.20", 100, 20);
                createProduct("Orange Juice 1L", "BEV-002", beverages, "1.00", "2.50", 40, 10);
                createProduct("Potato Chips 150g", "SNK-001", snacks, "0.80", "1.80", 8, 15);
            }
        }
    }

    private Category save(CategoryRepository repository, String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return repository.save(category);
    }

    private void createProduct(String name, String reference, Category category,
                                String purchasePrice, String sellingPrice, int quantity, int alertThreshold) {
        Product product = new Product();
        product.setName(name);
        product.setReference(reference);
        product.setCategory(category);
        product.setPurchasePrice(new BigDecimal(purchasePrice));
        product.setSellingPrice(new BigDecimal(sellingPrice));
        product.setQuantityInStock(quantity);
        product.setAlertThreshold(alertThreshold);
        productRepository.save(product);
    }
}
