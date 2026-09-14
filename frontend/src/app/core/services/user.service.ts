import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_VERSION } from '../api-config';
import {
    CreateUserRequest,
    Role,
    SelfUpdateRequest,
    UpdateUserRequest,
    User,
} from '../models/user.model';
import { AuthService } from './auth.service';

export type CreateUserData = Omit<CreateUserRequest, 'actorUserId'>;
export type UpdateUserData = Omit<UpdateUserRequest, 'actorUserId'>;

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly baseUrl = `${API_BASE_URL}/${API_VERSION}/users`;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {}

    getAll(): Observable<User[]> {
        return this.http.get<User[]>(this.baseUrl, {
            params: { actorUserId: this.authService.currentUserId! },
        });
    }

    create(data: CreateUserData): Observable<User> {
        const request: CreateUserRequest = {
            ...data,
            actorUserId: this.authService.currentUserId!,
        };
        return this.http.post<User>(this.baseUrl, request);
    }

    update(id: string, data: UpdateUserData): Observable<User> {
        const request: UpdateUserRequest = {
            ...data,
            actorUserId: this.authService.currentUserId!,
        };
        return this.http.put<User>(`${this.baseUrl}/${id}`, request);
    }

    updateSelf(data: Omit<SelfUpdateRequest, 'userId'>): Observable<User> {
        const request: SelfUpdateRequest = { ...data, userId: this.authService.currentUserId! };
        return this.http.put<User>(`${this.baseUrl}/me`, request);
    }
}

export const ASSIGNABLE_ROLES: { value: Role; label: string }[] = [
    { value: 'ADMIN', label: 'Shop Admin' },
    { value: 'SELLER', label: 'Seller' },
    { value: 'COMPTA', label: 'Compta' },
];
