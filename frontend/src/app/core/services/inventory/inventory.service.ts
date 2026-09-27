import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PREFIX, API_VERSION } from '@core/api-config';
import { Product } from '@core/models/product.model';
import { AuthService } from '@core/services/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
    private readonly baseUrl = `${API_BASE_URL}/${API_PREFIX}/${API_VERSION}/inventory`;

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
