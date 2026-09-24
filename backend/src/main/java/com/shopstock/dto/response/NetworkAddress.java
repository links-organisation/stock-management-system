package com.shopstock.dto.response;

public record NetworkAddress(
        String interfaceName,
        String ip,
        String url
) {
}
