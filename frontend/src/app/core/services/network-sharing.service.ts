import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PREFIX, API_VERSION } from '../api-config';
import { NetworkInfo } from '../models/network.model';

@Injectable({ providedIn: 'root' })
export class NetworkSharingService {
    private readonly baseUrl = `${API_BASE_URL}/${API_PREFIX}/${API_VERSION}/network`;

    constructor(private http: HttpClient) {}

    getNetworkInfo(): Observable<NetworkInfo> {
        return this.http.get<NetworkInfo>(`${this.baseUrl}/info`);
    }
}
