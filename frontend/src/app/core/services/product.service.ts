import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { Product, ProductRequest } from '../models/product.model';
import { AuthService } from './auth.service';

export type ProductFormData = Omit<ProductRequest, 'userId'>;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly baseUrl = `${API_BASE_URL}/products`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  search(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/search`, { params: { query } });
  }

  create(data: ProductFormData): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, this.withUser(data));
  }

  update(id: number, data: ProductFormData): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, this.withUser(data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private withUser(data: ProductFormData): ProductRequest {
    return { ...data, userId: this.authService.currentUserId! };
  }
}
