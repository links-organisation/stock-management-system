package com.shopstock.exception;

public class ProductInUseException extends RuntimeException {

    public ProductInUseException(String message) {
        super(message);
    }
}
