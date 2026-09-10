package com.shopstock.entity;

public enum Role {
    SUPER_ADMIN(3),
    ADMIN(2),
    SELLER(1),
    COMPTA(1);

    private final int level;

    Role(int level) {
        this.level = level;
    }

    public boolean isAtLeast(Role other) {
        return this.level >= other.level;
    }
}
