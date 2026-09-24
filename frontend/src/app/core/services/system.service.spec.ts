import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SystemService } from './system.service';
import { AuthService } from './auth.service';

describe('SystemService', () => {
    let service: SystemService;
    let httpMock: HttpTestingController;
    const authServiceStub = { currentUserId: 'actor-1' };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceStub },
            ],
        });
        service = TestBed.inject(SystemService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('defaults isShutdown to false', () => {
        expect(service.isShutdown()).toBe(false);
    });

    it('shutdown() POSTs to /system/shutdown with the actor userId as a query param', () => {
        service.shutdown().subscribe();

        const req = httpMock.expectOne((r) => r.url.endsWith('/system/shutdown') && r.method === 'POST');
        expect(req.request.params.get('userId')).toBe('actor-1');
        expect(req.request.body).toBeNull();
        req.flush(null);
    });
});
