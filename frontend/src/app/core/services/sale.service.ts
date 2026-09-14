import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_VERSION } from '../api-config';
import { Sale, SaleItemRequest } from '../models/sale.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SaleService {
    private readonly baseUrl = `${API_BASE_URL}/${API_VERSION}/sales`;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {}

    getAll(): Observable<Sale[]> {
        return this.http.get<Sale[]>(this.baseUrl);
    }

    getById(id: string): Observable<Sale> {
        return this.http.get<Sale>(`${this.baseUrl}/${id}`);
    }

    createSale(items: SaleItemRequest[], customerName?: string): Observable<Sale> {
        return this.http.post<Sale>(this.baseUrl, {
            userId: this.authService.currentUserId,
            customerName,
            items,
        });
    }
}
