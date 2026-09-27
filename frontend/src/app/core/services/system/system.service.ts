import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL, API_PREFIX, API_VERSION } from '@core/api-config';
import { AuthService } from '@core/services/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class SystemService {
    private readonly baseUrl = `${API_BASE_URL}/${API_PREFIX}/${API_VERSION}/system`;
    private authService = inject(AuthService);

    /** App-wide: true once a shutdown request has been sent, win or lose. Drives the
     *  "server stopped" full-page takeover in the root component. */
    readonly isShutdown = signal(false);

    constructor(private http: HttpClient) {}

    shutdown(): Observable<void> {
        return this.http
            .post<void>(`${this.baseUrl}/shutdown`, null, {
                params: { userId: this.authService.currentUserId! },
            })
            .pipe(tap(() => this.authService.logout()));
    }
}
