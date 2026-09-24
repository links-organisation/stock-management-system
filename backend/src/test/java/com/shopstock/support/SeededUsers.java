package com.shopstock.support;

import com.shopstock.entity.User;
import com.shopstock.repository.UserRepository;

/**
 * Looks up DataSeeder's fixed 4 seeded users by username, so every
 * integration test reads the same way instead of hardcoding UUIDs
 * (which are randomly generated at insert time).
 */
public final class SeededUsers {

    private SeededUsers() {
    }

    public static User superAdmin(UserRepository repo) {
        return get(repo, "superadmin");
    }

    public static User admin(UserRepository repo) {
        return get(repo, "admin");
    }

    public static User seller(UserRepository repo) {
        return get(repo, "seller");
    }

    public static User compta(UserRepository repo) {
        return get(repo, "compta");
    }

    private static User get(UserRepository repo, String username) {
        return repo.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("DataSeeder did not seed expected user '" + username + "'"));
    }
}
