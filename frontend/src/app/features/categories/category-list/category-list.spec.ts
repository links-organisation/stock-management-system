import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { Category } from '../../../core/models/category.model';
import { CategoryList } from './category-list';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const beverages: Category = { id: 'c1', name: 'Beverages', prefix: 'BEV', description: null };

describe('CategoryList', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CategoryList],
            providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), transloco()],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    /** Creates the fixture and flushes the constructor's initial getAll() load. */
    function createLoaded(categories: Category[] = [beverages]) {
        const fixture = TestBed.createComponent(CategoryList);
        const req = httpMock.expectOne((r) => r.url.endsWith('/categories') && r.method === 'GET');
        req.flush(categories);
        fixture.detectChanges();
        return fixture;
    }

    it('should create and load categories', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.categories()).toEqual([beverages]);
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('sets an error message when loading categories fails', () => {
        const fixture = TestBed.createComponent(CategoryList);
        const req = httpMock.expectOne((r) => r.url.endsWith('/categories') && r.method === 'GET');
        req.flush('boom', { status: 500, statusText: 'Server Error' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('flags the name field notUnique when checkAvailability reports it taken', () => {
        const fixture = createLoaded();

        fixture.componentInstance.form.get('name')?.setValue('Snacks');
        const req = httpMock.expectOne((r) => r.url.endsWith('/categories/check-availability') && r.method === 'GET');
        expect(req.request.params.get('column')).toBe('name');
        expect(req.request.params.get('value')).toBe('Snacks');
        req.flush({ available: false });

        expect(fixture.componentInstance.form.get('name')?.hasError('notUnique')).toBe(true);
    });

    it('clears the notUnique error when checkAvailability reports the name available', () => {
        const fixture = createLoaded();
        fixture.componentInstance.form.get('name')?.setValue('Snacks');
        httpMock.expectOne((r) => r.url.endsWith('/categories/check-availability')).flush({ available: false });
        expect(fixture.componentInstance.form.get('name')?.hasError('notUnique')).toBe(true);

        fixture.componentInstance.form.get('name')?.setValue('Something Else');
        httpMock.expectOne((r) => r.url.endsWith('/categories/check-availability')).flush({ available: true });

        expect(fixture.componentInstance.form.get('name')?.hasError('notUnique')).toBe(false);
    });

    it('does not call checkAvailability when the name field is cleared to blank', () => {
        const fixture = createLoaded();

        fixture.componentInstance.form.get('name')?.setValue('   ');

        httpMock.expectNone((r) => r.url.endsWith('/categories/check-availability'));
    });

    it('creates a new category on submit and shows a success message', () => {
        const fixture = createLoaded([]);
        fixture.componentInstance.form.setValue({ name: 'Dairy', prefix: 'DRY', description: '' });
        httpMock.match((r) => r.url.endsWith('/categories/check-availability')).forEach((req) =>
            req.flush({ available: true }),
        );

        fixture.componentInstance.onSubmit();

        const req = httpMock.expectOne((r) => r.url.endsWith('/categories') && r.method === 'POST');
        expect(req.request.body).toEqual({ name: 'Dairy', prefix: 'DRY', description: undefined, userId: null });
        req.flush({ id: 'c2', name: 'Dairy', prefix: 'DRY', description: null });

        expect(fixture.componentInstance.categories()).toContainEqual({ id: 'c2', name: 'Dairy', prefix: 'DRY', description: null });
        expect(fixture.componentInstance.successMessage()).not.toBe('');
        expect(fixture.componentInstance.isSaving()).toBe(false);
    });

    it('does not submit when the form is invalid', () => {
        const fixture = createLoaded([]);

        fixture.componentInstance.onSubmit();

        httpMock.expectNone((r) => r.method === 'POST');
        expect(fixture.componentInstance.form.get('name')?.touched).toBe(true);
    });

    it('onEdit populates the form and switches to edit mode', () => {
        const fixture = createLoaded();

        fixture.componentInstance.onEdit(beverages);

        expect(fixture.componentInstance.editingCategory()).toEqual(beverages);
        expect(fixture.componentInstance.form.value).toEqual({ name: 'Beverages', prefix: 'BEV', description: '' });
    });

    it('updates the edited category on submit', () => {
        const fixture = createLoaded();
        fixture.componentInstance.onEdit(beverages);
        fixture.componentInstance.form.patchValue({ description: 'Cold drinks' });

        fixture.componentInstance.onSubmit();

        const req = httpMock.expectOne((r) => r.url.endsWith('/categories/c1') && r.method === 'PUT');
        expect(req.request.body).toEqual({ name: 'Beverages', prefix: 'BEV', description: 'Cold drinks', userId: null });
        req.flush({ id: 'c1', name: 'Beverages', prefix: 'BEV', description: 'Cold drinks' });

        expect(fixture.componentInstance.editingCategory()).toBeNull();
        expect(fixture.componentInstance.successMessage()).not.toBe('');
    });

    it('cancelEdit resets the form and clears editingCategory', () => {
        const fixture = createLoaded();
        fixture.componentInstance.onEdit(beverages);

        fixture.componentInstance.cancelEdit();

        expect(fixture.componentInstance.editingCategory()).toBeNull();
        expect(fixture.componentInstance.form.value).toEqual({ name: '', prefix: '', description: '' });
    });

    it('deletes a category when the user confirms', () => {
        const fixture = createLoaded();
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        fixture.componentInstance.onDeleteCategory(beverages);

        const req = httpMock.expectOne((r) => r.url.endsWith('/categories/c1') && r.method === 'DELETE');
        req.flush(null);

        expect(fixture.componentInstance.categories()).toEqual([]);
        expect(fixture.componentInstance.successMessage()).not.toBe('');
    });

    it('does not delete when the user cancels the confirmation', () => {
        const fixture = createLoaded();
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        fixture.componentInstance.onDeleteCategory(beverages);

        httpMock.expectNone((r) => r.url.endsWith('/categories/c1') && r.method === 'DELETE');
        expect(fixture.componentInstance.categories()).toEqual([beverages]);
    });
});
