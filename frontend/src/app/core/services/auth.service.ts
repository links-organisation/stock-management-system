import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { LoginRequest, User } from '../models/user.model';

const STORAGE_KEY = 'stock-management.currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<User> {
    return this.http.post<User>(`${API_BASE_URL}/auth/login`, request).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get currentUserId(): number | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
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
