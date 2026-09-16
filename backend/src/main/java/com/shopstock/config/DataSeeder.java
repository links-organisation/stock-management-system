package com.shopstock.config;

import com.shopstock.entity.Category;
import com.shopstock.entity.Product;
import com.shopstock.entity.Role;
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
            // The one and only Super Admin. No API path can create another.
            createUser("admin", "admin123", "Shop Administrator", Role.SUPER_ADMIN);

            // Demo accounts for each other role, for convenience while testing.
            createUser("shopadmin", "admin123", "Store Admin", Role.ADMIN);
            createUser("seller", "seller123", "Front Desk Seller", Role.SELLER);
            createUser("compta", "compta123", "Accountant", Role.COMPTA);
        }

        if (categoryRepository.count() == 0) {
            Category beverages = save(categoryRepository, "Beverages", "BEV", "Drinks and refreshments");
            Category snacks = save(categoryRepository, "Snacks", "SNK", "Chips, biscuits and other snacks");

            if (productRepository.count() == 0) {
                createProduct("Mineral Water 1L", "BEV-001", beverages, "250.0", "350.0", 100, 20);
                createProduct("Orange Juice 1L", "BEV-002", beverages, "600.0", "750.0", 40, 10);
                createProduct("Potato Chips 150g", "SNK-001", snacks, "100.0", "75.0", 8, 15);
            }
        }
    }

    private void createUser(String username, String password, String fullName, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(BCrypt.hashpw(password, BCrypt.gensalt()));
        user.setFullName(fullName);
        user.setRole(role);
        userRepository.save(user);
    }

    private Category save(CategoryRepository repository, String name, String prefix, String description) {
        Category category = new Category();
        category.setName(name);
        category.setPrefix(prefix);
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
