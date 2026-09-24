import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { User } from '../../../core/models/user.model';
import { UserForm, UserFormValue } from './user-form';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const seller: User = { id: 'u2', fullName: 'Front Desk Seller', username: 'seller', role: 'SELLER' };
const roles = [
    { value: 'ADMIN' as const, labelKey: 'userRole.shopAdmin' },
    { value: 'SELLER' as const, labelKey: 'userRole.seller' },
    { value: 'COMPTA' as const, labelKey: 'userRole.compta' },
];

describe('UserForm', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserForm],
            providers: [provideZonelessChangeDetection(), transloco()],
        }).compileComponents();
    });

    it('should create in "register" mode by default, with password required', () => {
        const fixture = TestBed.createComponent(UserForm);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.isEditing()).toBe(false);
        expect(fixture.componentInstance.form.get('password')?.hasError('required')).toBe(true);
    });

    it('defaults the role to the first assignable role when creating', () => {
        const fixture = TestBed.createComponent(UserForm);
        fixture.componentRef.setInput('assignableRoles', roles);
        fixture.detectChanges();

        expect(fixture.componentInstance.form.value.role).toBe('ADMIN');
    });

    it('populates the form and switches to "editing" mode when a user input is provided', () => {
        const fixture = TestBed.createComponent(UserForm);
        fixture.componentRef.setInput('user', seller);
        fixture.detectChanges();

        expect(fixture.componentInstance.isEditing()).toBe(true);
        expect(fixture.componentInstance.form.value.username).toBe('seller');
        expect(fixture.componentInstance.form.value.fullName).toBe('Front Desk Seller');
        expect(fixture.componentInstance.form.value.role).toBe('SELLER');
    });

    it('does not require a password when editing', () => {
        const fixture = TestBed.createComponent(UserForm);
        fixture.componentRef.setInput('user', seller);
        fixture.detectChanges();

        expect(fixture.componentInstance.form.get('password')?.hasError('required')).toBe(false);
    });

    it('does not submit an invalid form', () => {
        const fixture = TestBed.createComponent(UserForm);
        fixture.detectChanges();
        const emitted: UserFormValue[] = [];
        fixture.componentInstance.save.subscribe((v) => emitted.push(v));

        fixture.componentInstance.onSubmit();

        expect(emitted).toEqual([]);
        expect(fixture.componentInstance.form.get('username')?.touched).toBe(true);
    });

    it('emits save with the password included when registering a new user', () => {
        const fixture = TestBed.createComponent(UserForm);
        fixture.detectChanges();
        fixture.componentInstance.form.setValue({
            fullName: 'New Seller',
            username: 'newseller',
            password: 'pw12345',
            role: 'SELLER',
        });
        const emitted: UserFormValue[] = [];
        fixture.componentInstance.save.subscribe((v) => emitted.push(v));

        fixture.componentInstance.onSubmit();

        expect(emitted).toEqual([
            { fullName: 'New Seller', username: 'newseller', password: 'pw12345', role: 'SELLER' },
        ]);
    });

    it('emits save without a password field when editing and the password is left blank', () => {
        const fixture = TestBed.createComponent(UserForm);
        fixture.componentRef.setInput('user', seller);
        fixture.detectChanges();
        const emitted: UserFormValue[] = [];
        fixture.componentInstance.save.subscribe((v) => emitted.push(v));

        fixture.componentInstance.onSubmit();

        expect(emitted).toHaveLength(1);
        expect(emitted[0]).not.toHaveProperty('password');
        expect(emitted[0]).toMatchObject({ fullName: 'Front Desk Seller', username: 'seller', role: 'SELLER' });
    });

    it('emits save with the new password when editing and a password is provided', () => {
        const fixture = TestBed.createComponent(UserForm);
        fixture.componentRef.setInput('user', seller);
        fixture.detectChanges();
        fixture.componentInstance.form.patchValue({ password: 'newpass1' });
        const emitted: UserFormValue[] = [];
        fixture.componentInstance.save.subscribe((v) => emitted.push(v));

        fixture.componentInstance.onSubmit();

        expect(emitted[0].password).toBe('newpass1');
    });

    it('emits cancel when requested', () => {
        const fixture = TestBed.createComponent(UserForm);
        fixture.detectChanges();
        let cancelled = false;
        fixture.componentInstance.cancel.subscribe(() => (cancelled = true));

        fixture.componentInstance.cancel.emit();

        expect(cancelled).toBe(true);
    });
});
