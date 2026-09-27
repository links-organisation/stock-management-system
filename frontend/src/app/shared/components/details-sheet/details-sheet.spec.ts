import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '@core/i18n/transloco-loader';
import { DetailsSheet } from './details-sheet';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

@Component({
    standalone: true,
    imports: [DetailsSheet],
    template: `
        <app-details-sheet [title]="title" (close)="onClose()">
            <p class="projected">Hello</p>
            <button sheet-actions class="action" type="button">Action</button>
        </app-details-sheet>
    `,
})
class HostComponent {
    title = 'Test title';
    closed = false;
    onClose(): void {
        this.closed = true;
    }
}

describe('DetailsSheet', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [provideZonelessChangeDetection(), transloco()],
        }).compileComponents();
    });

    it('renders the title and the projected default and sheet-actions content', () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Test title');
        expect(fixture.nativeElement.querySelector('.projected').textContent).toContain('Hello');
        expect(fixture.nativeElement.querySelector('.action')).not.toBeNull();
    });

    it('emits close when the backdrop is clicked', () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('.backdrop').click();

        expect(fixture.componentInstance.closed).toBe(true);
    });

    it('does not emit close when clicking inside the sheet', () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('.sheet').click();

        expect(fixture.componentInstance.closed).toBe(false);
    });

    it('emits close when the header close button is clicked', () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('.icon-close').click();

        expect(fixture.componentInstance.closed).toBe(true);
    });

    it('emits close when the footer close button is clicked', () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();

        const footerButtons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('footer button'));
        const closeButton = footerButtons.find((b) => !b.classList.contains('action'));

        closeButton!.click();

        expect(fixture.componentInstance.closed).toBe(true);
    });
});
