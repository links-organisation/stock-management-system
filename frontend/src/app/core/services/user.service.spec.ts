import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ASSIGNABLE_ROLES, UserService } from './user.service';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

describe('UserService', () => {
    let service: UserService;
    let httpMock: HttpTestingController;
    const authServiceStub = { currentUserId: 'actor-1' };

    const user: User = { id: 'u1', username: 'seller', fullName: 'Seller One', role: 'SELLER' };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceStub },
            ],
        });
        service = TestBed.inject(UserService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getAll() sends actorUserId as a query param', () => {
        service.getAll().subscribe((res) => expect(res).toEqual([user]));
        const req = httpMock.expectOne((r) => r.url.endsWith('/users') && r.method === 'GET');
        expect(req.request.params.get('actorUserId')).toBe('actor-1');
        req.flush([user]);
    });

    it('create() POSTs the form data with actorUserId attached', () => {
        service.create({ username: 'seller', password: 'pw', fullName: 'Seller One', role: 'SELLER' }).subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/users') && r.method === 'POST');
        expect(req.request.body).toEqual({
            username: 'seller',
            password: 'pw',
            fullName: 'Seller One',
            role: 'SELLER',
            actorUserId: 'actor-1',
        });
        req.flush(user);
    });

    it('update() PUTs to /users/{id} with actorUserId attached', () => {
        service.update('u1', { fullName: 'Renamed' }).subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/users/u1') && r.method === 'PUT');
        expect(req.request.body).toEqual({ fullName: 'Renamed', actorUserId: 'actor-1' });
        req.flush(user);
    });

    it('updateSelf() PUTs to /users/me with the current userId attached', () => {
        service.updateSelf({ fullName: 'New Name' }).subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/users/me') && r.method === 'PUT');
        expect(req.request.body).toEqual({ fullName: 'New Name', userId: 'actor-1' });
        req.flush(user);
    });

    it('ASSIGNABLE_ROLES excludes SUPER_ADMIN and exposes a label key per role', () => {
        expect(ASSIGNABLE_ROLES.map((r) => r.value)).toEqual(['ADMIN', 'SELLER', 'COMPTA']);
        expect(ASSIGNABLE_ROLES.every((r) => typeof r.labelKey === 'string' && r.labelKey.length > 0)).toBe(true);
    });
});
