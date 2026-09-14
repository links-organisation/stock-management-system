import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_VERSION } from '../api-config';
import { Invoice } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
    private readonly baseUrl = `${API_BASE_URL}/${API_VERSION}/invoices`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(this.baseUrl);
    }

    getById(id: string): Observable<Invoice> {
        return this.http.get<Invoice>(`${this.baseUrl}/${id}`);
    }
}
