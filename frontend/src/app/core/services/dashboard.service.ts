import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PREFIX, API_VERSION } from '../api-config';
import { DashboardSummary } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly baseUrl = `${API_BASE_URL}/${API_PREFIX}/${API_VERSION}/dashboard`;

    constructor(private http: HttpClient) {}

    getSummary(): Observable<DashboardSummary> {
        return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`);
    }
}
