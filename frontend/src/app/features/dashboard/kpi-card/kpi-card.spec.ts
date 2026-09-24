import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KpiCard],
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();
    });

    it('should create with default inputs', () => {
        const fixture = TestBed.createComponent(KpiCard);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.tone()).toBe('default');
    });

    it('renders the provided label and value', () => {
        const fixture = TestBed.createComponent(KpiCard);
        fixture.componentRef.setInput('label', 'Stock value');
        fixture.componentRef.setInput('value', '1,234 FCFA');
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('Stock value');
        expect(text).toContain('1,234 FCFA');
    });

    it('applies the tone as a CSS class', () => {
        const fixture = TestBed.createComponent(KpiCard);
        fixture.componentRef.setInput('tone', 'danger');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.kpi--danger')).not.toBeNull();
    });
});
