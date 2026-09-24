import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NetworkSharingService } from './network-sharing.service';
import { NetworkInfo } from '../models/network.model';

describe('NetworkSharingService', () => {
    let service: NetworkSharingService;
    let httpMock: HttpTestingController;

    const info: NetworkInfo = {
        enabled: true,
        https: false,
        port: 8080,
        addresses: [{ interfaceName: 'Wi-Fi', ip: '192.168.1.15', url: 'http://192.168.1.15:8080' }],
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(NetworkSharingService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getNetworkInfo() issues a GET to /network/info and returns the body', () => {
        service.getNetworkInfo().subscribe((res) => expect(res).toEqual(info));

        const req = httpMock.expectOne((r) => r.url.endsWith('/network/info') && r.method === 'GET');
        req.flush(info);
    });
});
