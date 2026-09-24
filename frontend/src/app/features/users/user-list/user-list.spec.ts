import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { UserList } from './user-list';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const seller: User = { id: 'u2', fullName: 'Front Desk Seller', username: 'seller', role: 'SELLER' };
const admin: User = { id: 'u3', fullName: 'Store Admin', username: 'admin', role: 'ADMIN' };
const superAdmin: User = { id: 'u1', fullName: 'Shop Administrator', username: 'superadmin', role: 'SUPER_ADMIN' };

describe('UserList', () => {
    let httpMock: HttpTestingController;
    let authServiceStub: { currentRole: string | null };

    beforeEach(async () => {
        authServiceStub = { currentRole: 'SUPER_ADMIN' };
        await TestBed.configureTestingModule({
            imports: [UserList],
            providers: [
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting(),
                transloco(),
                { provide: AuthService, useValue: authServiceStub },
            ],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    function createLoaded(users: User[] = [seller, admin, superAdmin]) {
        const fixture = TestBed.createComponent(UserList);
        httpMock.expectOne((r) => r.url.endsWith('/users') && r.method === 'GET').flush(users);
        return fixture;
    }

    it('should create and load users', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.users()).toEqual([seller, admin, superAdmin]);
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('sets an error message when loading fails', () => {
        const fixture = TestBed.createComponent(UserList);
        httpMock.expectOne((r) => r.url.endsWith('/users')).flush('boom', { status: 500, statusText: 'Server Error' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('a Super Admin can assign every non-Super-Admin role', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance.assignableRoles.map((r) => r.value)).toEqual(['ADMIN', 'SELLER', 'COMPTA']);
    });

    it('an Admin can only assign Seller/Compta roles', () => {
        authServiceStub.currentRole = 'ADMIN';
        const fixture = createLoaded();

        expect(fixture.componentInstance.assignableRoles.map((r) => r.value)).toEqual(['SELLER', 'COMPTA']);
    });

    it('canManage: nobody can manage a Super Admin', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance.canManage(superAdmin)).toBe(false);
    });

    it('canManage: a Super Admin can manage Admin/Seller/Compta', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance.canManage(admin)).toBe(true);
        expect(fixture.componentInstance.canManage(seller)).toBe(true);
    });

    it('canManage: an Admin can only manage Seller/Compta, not other Admins', () => {
        authServiceStub.currentRole = 'ADMIN';
        const fixture = createLoaded();

        expect(fixture.componentInstance.canManage(seller)).toBe(true);
        expect(fixture.componentInstance.canManage(admin)).toBe(false);
    });

    it('canManage: a Seller cannot manage anyone', () => {
        authServiceStub.currentRole = 'SELLER';
        const fixture = createLoaded();

        expect(fixture.componentInstance.canManage(seller)).toBe(false);
    });

    it('openCreateForm clears editingUser and opens the form', () => {
        const fixture = createLoaded();

        fixture.componentInstance.openCreateForm();

        expect(fixture.componentInstance.editingUser()).toBeNull();
        expect(fixture.componentInstance.isFormOpen()).toBe(true);
    });

    it('openEditForm sets editingUser and opens the form', () => {
        const fixture = createLoaded();

        fixture.componentInstance.openEditForm(seller);

        expect(fixture.componentInstance.editingUser()).toEqual(seller);
        expect(fixture.componentInstance.isFormOpen()).toBe(true);
    });

    it('closeForm hides the form and clears editingUser', () => {
        const fixture = createLoaded();
        fixture.componentInstance.openEditForm(seller);

        fixture.componentInstance.closeForm();

        expect(fixture.componentInstance.isFormOpen()).toBe(false);
        expect(fixture.componentInstance.editingUser()).toBeNull();
    });

    it('onSave creates a user when not editing, then reloads and shows success', () => {
        const fixture = createLoaded([]);
        const formValue = { fullName: 'New Seller', username: 'newseller', password: 'pw123', role: 'SELLER' as const };

        fixture.componentInstance.onSave(formValue);

        const createReq = httpMock.expectOne((r) => r.url.endsWith('/users') && r.method === 'POST');
        expect(createReq.request.body).toMatchObject({ fullName: 'New Seller', username: 'newseller', role: 'SELLER' });
        createReq.flush({ id: 'u4', ...formValue });
        httpMock.expectOne((r) => r.url.endsWith('/users') && r.method === 'GET').flush([]);

        expect(fixture.componentInstance.isFormOpen()).toBe(false);
        expect(fixture.componentInstance.successMessage()).not.toBe('');
    });

    it('onSave updates the user when editing', () => {
        const fixture = createLoaded([seller]);
        fixture.componentInstance.openEditForm(seller);
        const formValue = { fullName: 'Renamed Seller', username: 'seller', role: 'SELLER' as const };

        fixture.componentInstance.onSave(formValue);

        const updateReq = httpMock.expectOne((r) => r.url.endsWith('/users/u2') && r.method === 'PUT');
        updateReq.flush({ ...seller, fullName: 'Renamed Seller' });
        httpMock.expectOne((r) => r.url.endsWith('/users') && r.method === 'GET').flush([{ ...seller, fullName: 'Renamed Seller' }]);

        expect(fixture.componentInstance.successMessage()).not.toBe('');
    });

    it('sets an error message when saving fails', () => {
        const fixture = createLoaded([]);
        const formValue = { fullName: 'New Seller', username: 'newseller', password: 'pw123', role: 'SELLER' as const };

        fixture.componentInstance.onSave(formValue);

        httpMock
            .expectOne((r) => r.url.endsWith('/users') && r.method === 'POST')
            .flush('boom', { status: 409, statusText: 'Conflict' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
    });
});
