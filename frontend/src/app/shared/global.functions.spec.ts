import { ArrowDown, ArrowUp, compare, formatDateForInput, formatDateV2, sortData } from './global.functions';
import { Sort } from '../core/models/types';

describe('formatDateForInput', () => {
    it('returns an empty string for undefined', () => {
        expect(formatDateForInput(undefined)).toBe('');
    });

    it('formats a Date object as YYYY-MM-DD', () => {
        expect(formatDateForInput(new Date(2024, 0, 5))).toBe('2024-01-05');
    });

    it('formats a date string as YYYY-MM-DD', () => {
        expect(formatDateForInput('2024-11-20T10:00:00')).toBe('2024-11-20');
    });

    it('zero-pads single-digit month and day', () => {
        expect(formatDateForInput(new Date(2024, 2, 3))).toBe('2024-03-03');
    });
});

describe('formatDateV2', () => {
    it('returns null for undefined, null, and empty string', () => {
        expect(formatDateV2(undefined)).toBeNull();
        expect(formatDateV2(null)).toBeNull();
        expect(formatDateV2('')).toBeNull();
    });

    it('formats a date using fr-FR locale, matching Date.toLocaleDateString directly', () => {
        const input = new Date(2024, 0, 5);
        const expected = input.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });

        expect(formatDateV2(input)).toBe(expected);
    });

    it('accepts a numeric timestamp', () => {
        const timestamp = new Date(2024, 5, 15).getTime();
        const expected = new Date(timestamp).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        expect(formatDateV2(timestamp)).toBe(expected);
    });
});

describe('compare', () => {
    it('returns -1 when a < b and ascending', () => {
        expect(compare(1, 2, true)).toBe(-1);
    });

    it('returns 1 when a < b and descending', () => {
        expect(compare(1, 2, false)).toBe(1);
    });

    it('returns 1 when a > b and ascending', () => {
        expect(compare(2, 1, true)).toBe(1);
    });

    it('returns -1 when a > b and descending', () => {
        expect(compare(2, 1, false)).toBe(-1);
    });

    it('compares strings lexicographically', () => {
        expect(compare('apple', 'banana', true)).toBe(-1);
        expect(compare('banana', 'apple', true)).toBe(1);
    });
});

describe('ArrowUp / ArrowDown', () => {
    it('returns the solid icon path by default', () => {
        expect(ArrowUp()).toBe('/icons/arrow-up.svg');
        expect(ArrowDown()).toBe('/icons/arrow-down.svg');
    });

    it('returns the outline icon path when outline=true', () => {
        expect(ArrowUp(true)).toBe('/icons/arrow-up-outline.svg');
        expect(ArrowDown(true)).toBe('/icons/arrow-down-outline.svg');
    });
});

describe('sortData', () => {
    // Pins down the function's actual current behavior (not a statement that it's
    // the "correct"/intended behavior). Notably: when a different column is clicked
    // (sort.active !== active), it resets direction to 'asc' but keeps sort.active
    // as the returned active field rather than switching to the newly-clicked one.

    it('resets direction to "asc" and keeps the previous active column when a different column is clicked', () => {
        const sort: Sort = { active: 'name', direction: 'desc' };

        const result = sortData(sort, 'price');

        expect(result).toEqual({ active: 'name', direction: 'asc' });
    });

    it('toggles direction from "asc" to "desc" when the same column is clicked again', () => {
        const sort: Sort = { active: 'name', direction: 'asc' };

        const result = sortData(sort, 'name');

        expect(result).toEqual({ active: 'name', direction: 'desc' });
    });

    it('toggles direction from "desc" to "asc" when the same column is clicked again', () => {
        const sort: Sort = { active: 'name', direction: 'desc' };

        const result = sortData(sort, 'name');

        expect(result).toEqual({ active: 'name', direction: 'asc' });
    });

    it('treats an unrecognized direction as "asc" before toggling', () => {
        const sort: Sort = { active: 'name', direction: '' };

        const result = sortData(sort, 'name');

        expect(result).toEqual({ active: 'name', direction: 'desc' });
    });
});
