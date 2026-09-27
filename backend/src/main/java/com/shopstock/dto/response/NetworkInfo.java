package com.shopstock.dto.response;

import java.util.List;

public record NetworkInfo(
        boolean enabled,
        boolean https,
        boolean certificateValid,
        int port,
        List<NetworkAddress> addresses
) {
}
