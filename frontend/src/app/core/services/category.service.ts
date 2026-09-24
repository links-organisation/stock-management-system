import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PREFIX, API_VERSION } from '../api-config';
import { Category, CategoryRequest } from '../models/category.model';
import { AuthService } from './auth.service';

export type CategoryFormData = Omit<CategoryRequest, 'userId'>;

@Injectable({ providedIn: 'root' })
export class CategoryService {
    private readonly baseUrl = `${API_BASE_URL}/${API_PREFIX}/${API_VERSION}/categories`;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {}

    getAll(): Observable<Category[]> {
        return this.http.get<Category[]>(this.baseUrl);
    }

    getById(id: string): Observable<Category> {
        return this.http.get<Category>(`${this.baseUrl}/${id}`);
    }

    create(data: CategoryFormData): Observable<Category> {
        const request: CategoryRequest = { ...data, userId: this.authService.currentUserId! };
        return this.http.post<Category>(this.baseUrl, request);
    }

    update(id: string, data: CategoryFormData): Observable<Category> {
        const request: CategoryRequest = { ...data, userId: this.authService.currentUserId! };
        return this.http.put<Category>(`${this.baseUrl}/${id}`, request);
    }

    checkAvailability(column: string, value: string): Observable<{ available: boolean }> {
        return this.http.get<{ available: boolean }>(`${this.baseUrl}/check-availability`, {
            params: { column, value, userId: this.authService.currentUserId! }
        });
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`, {
            params: { userId: this.authService.currentUserId! }
        });
    }
}
