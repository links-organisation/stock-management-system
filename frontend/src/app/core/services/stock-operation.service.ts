import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { OperationType, StockOperation } from '../models/stock-operation.model';

export interface StockOperationFilter {
  productId?: string | null;
  type?: OperationType | '';
  userId?: string | null;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class StockOperationService {
  private readonly baseUrl = `${API_BASE_URL}/stock-operations`;

  constructor(private http: HttpClient) {}

  getAll(filter: StockOperationFilter = {}): Observable<StockOperation[]> {
    const params: Record<string, string> = {};
    if (filter.productId != null) params['productId'] = String(filter.productId);
    if (filter.type) params['type'] = filter.type;
    if (filter.userId != null) params['userId'] = String(filter.userId);
    if (filter.from) params['from'] = filter.from;
    if (filter.to) params['to'] = filter.to;

    return this.http.get<StockOperation[]>(this.baseUrl, { params });
  }
}
