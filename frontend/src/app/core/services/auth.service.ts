import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL, API_PREFIX, API_VERSION } from '../api-config';
import { LoginRequest, Role, User } from '../models/user.model';

const STORAGE_KEY = 'stock-management.currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());
    readonly currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {}

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    get currentUserId(): string | null {
        return this.currentUserSubject.value?.id ?? null;
    }

    get currentRole(): Role | null {
        return this.currentUserSubject.value?.role ?? null;
    }

    login(request: LoginRequest): Observable<User> {
        return this.http.post<User>(`${API_BASE_URL}/${API_PREFIX}/${API_VERSION}/auth/login`, request).pipe(
            tap((user) => {
                this.currentUserSubject.next(user);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            }),
        );
    }

    /** Reflects a profile edit (username/fullName/role) back into the stored session. */
    updateCurrentUser(user: User): void {
        this.currentUserSubject.next(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }

    logout(): void {
        this.currentUserSubject.next(null);
        localStorage.removeItem(STORAGE_KEY);
    }

    isLoggedIn(): boolean {
        return this.currentUserSubject.value !== null;
    }

    /** Super Admin and Admin: can manage products, inventory, and (with limits) users. */
    isAdminOrAbove(): boolean {
        const role = this.currentRole;
        return role === 'SUPER_ADMIN' || role === 'ADMIN';
    }

    /** Super Admin, Admin, and Seller: can create sales. */
    canSell(): boolean {
        const role = this.currentRole;
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SELLER';
    }

    private readStoredUser(): User | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as User) : null;
        } catch {
            return null;
        }
    }
}
