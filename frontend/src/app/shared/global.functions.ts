// Helper pour formater une date au format requis par <input type="date"> (local, sans décalage UTC)
import { assertInInjectionContext, ElementRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Sort } from '../core/models/types';

export function formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const isPlatformWebFunction = () => {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId);
};

export function injectNativeElement<T extends Element>(): T {
    assertInInjectionContext(injectNativeElement);
    return inject(ElementRef).nativeElement;
}

export function compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

export function formatDateV2(date: Date | string | number | undefined | null) {
    if (date == undefined || date == '') return null;
    return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

export function ArrowUp(outline: boolean = false): string {
    return outline ? '/icons/arrow-up-outline.svg' : '/icons/arrow-up.svg';
}

export function ArrowDown(outline: boolean = false): string {
    return outline ? '/icons/arrow-down-outline.svg' : '/icons/arrow-down.svg';
}

export function sortData(sort: Sort, active: string): Sort {
    console.log('Sorting...' + sort + ' | active: ' + active);
    let dir = Array.from(['asc', 'desc']).lastIndexOf(sort.direction) >= 0 ? sort.direction : 'asc';
    return sort.active != active ? { active: sort.active, direction: 'asc' } : {
        active: sort.active,
        direction: dir === 'asc' ? 'desc' : 'asc'
    };

}
