package com.shopstock.utils;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CoalesceTest {

    @Test
    void of_returnsFirstNonEmptyValue() {
        assertThat(Coalesce.of(null, "", "Hello", "World")).isEqualTo("Hello");
    }

    @Test
    void of_returnsNull_whenAllValuesEmpty() {
        assertThat(Coalesce.<String>of(null, "", "   ")).isNull();
    }

    @Test
    void of_treatsBlankStringAsEmpty() {
        assertThat(Coalesce.of("   ", "Value")).isEqualTo("Value");
    }

    @Test
    void of_treatsEmptyCollectionAsEmpty() {
        assertThat(Coalesce.of(List.of(), List.of("item"))).containsExactly("item");
    }

    @Test
    void of_returnsNonEmptyNonStringNonCollectionValue_asIs() {
        assertThat(Coalesce.of(null, 0, 42)).isEqualTo(0);
    }

    @Test
    void orDefault_returnsDefault_whenAllValuesEmpty() {
        assertThat(Coalesce.orDefault("Default", null, "", "   ")).isEqualTo("Default");
    }

    @Test
    void orDefault_returnsFirstNonEmptyValue_overDefault() {
        assertThat(Coalesce.orDefault("Default", null, "", "Hello")).isEqualTo("Hello");
    }
}
