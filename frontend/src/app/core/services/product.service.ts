import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_VERSION } from '../api-config';
import { Product, ProductRequest } from '../models/product.model';
import { AuthService } from './auth.service';

export type ProductFormData = Omit<ProductRequest, 'userId'>;

@Injectable({ providedIn: 'root' })
export class ProductService {
    private readonly baseUrl = `${API_BASE_URL}/${API_VERSION}/products`;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {}

    getAll(): Observable<Product[]> {
        return this.http.get<Product[]>(this.baseUrl);
    }

    getById(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.baseUrl}/${id}`);
    }

    search(query: string, categoryId?: string | null): Observable<Product[]> {
        const params: Record<string, string> = {};
        if (query) params['query'] = query;
        if (categoryId != null) params['categoryId'] = categoryId;
        return this.http.get<Product[]>(`${this.baseUrl}/search`, { params });
    }

    create(data: ProductFormData): Observable<Product> {
        return this.http.post<Product>(this.baseUrl, this.withUser(data));
    }

    update(id: string, data: ProductFormData): Observable<Product> {
        return this.http.put<Product>(`${this.baseUrl}/${id}`, this.withUser(data));
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`, {
            params: { userId: this.authService.currentUserId! },
        });
    }

    private withUser(data: ProductFormData): ProductRequest {
        return { ...data, userId: this.authService.currentUserId! };
    }
}
