import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { Category, CategoryRequest } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly baseUrl = `${API_BASE_URL}/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  create(request: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, request);
  }
}
