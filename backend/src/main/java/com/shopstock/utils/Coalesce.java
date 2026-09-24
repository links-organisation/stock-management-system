package com.shopstock.utils;

import java.util.Collection;

/**
 * Utility class for coalescing values. <br>
 * The `Coalesce` class provides methods to return the first non-empty value from a list of values. <br>
 * A value is considered empty if it is null, an empty string, or an empty collection. <br>
 * The `orDefault` method allows specifying a default value to return if all provided values are empty. <br>
 * Example usage: <br>
 * <pre>{@code Coalesce.of(null, "", 0) // returns 0 }</pre>
 * <pre>{@code Coalesce.of(null, "", "Hello", 0) // returns "Hello" }</pre>
 * <pre>{@code Coalesce.orDefault("Default", null, "", 0) // returns "Default" }</pre>
 * <pre>{@code Coalesce.orDefault("Default", null, "", 0, "Hello") // returns "Hello" }</pre>
 */
public final class Coalesce {

    private Coalesce() {
    }

    @SafeVarargs
    public static <T> T of(T... values) {
        for (T v : values)
            if (!isEmpty(v)) return v;
        return null;
    }

    @SafeVarargs
    public static <T> T orDefault(T defaultValue, T... values) {
        T result = of(values);
        return result != null ? result : defaultValue;
    }

    private static boolean isEmpty(Object value) {
        return switch (value) {
            case null -> true;
            case String s -> s.isBlank();
            // case BigDecimal bd -> bd.compareTo(BigDecimal.ZERO) == 0;
            // case Number n -> n.doubleValue() == 0.0;
            case Collection<?> c -> c.isEmpty();
            default -> false;
        };
    }
}