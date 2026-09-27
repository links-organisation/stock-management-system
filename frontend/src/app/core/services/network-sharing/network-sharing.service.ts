import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PREFIX, API_VERSION } from '@core/api-config';
import { NetworkInfo } from '@core/models/network.model';

@Injectable({ providedIn: 'root' })
export class NetworkSharingService {
    private readonly baseUrl = `${API_BASE_URL}/${API_PREFIX}/${API_VERSION}/network`;

    constructor(private http: HttpClient) {}

    getNetworkInfo(): Observable<NetworkInfo> {
        return this.http.get<NetworkInfo>(`${this.baseUrl}/info`);
    }

    getCertificateDownloadUrl(): string {
        return `${this.baseUrl}/certificate`;
    }

    getQrCodeUrl(url: string): string {
        return `${this.baseUrl}/qrcode?url=${encodeURIComponent(url)}`;
    }
}
