import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_VERSION } from '../api-config';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
    private readonly baseUrl = `${API_BASE_URL}/${API_VERSION}/inventory`;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {}

    adjust(productId: string, newQuantity: number, comment?: string): Observable<Product> {
        return this.http.post<Product>(`${this.baseUrl}/adjust`, {
            productId,
            newQuantity,
            comment,
            userId: this.authService.currentUserId,
        });
    }
}
