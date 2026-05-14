import {
  Injectable,
  inject,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';
import {
  LoginCredentials,
  LoginSuccessInterface,
  Tokens,
} from '@shared/interfaces/login.interface';
import { LogOutInterface } from '@shared/interfaces/logout.interface';

type StoredSession = LoginSuccessInterface & { _remember: boolean };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly SESSION_KEY = '_lcdp_session';
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private _isRefreshing = false;

  get isRefreshing(): boolean {
    return this._isRefreshing;
  }

  set isRefreshing(value: boolean) {
    this._isRefreshing = value;
  }

  private _isLogged = new BehaviorSubject<boolean>(this.isAuthenticated());
  readonly isLogged$ = this._isLogged.asObservable();

  constructor() {
    if (this.isAuthenticated()) this.scheduleTokenRefresh();
  }

  login(
    credentials: LoginCredentials,
    remember: boolean,
  ): Observable<ApiResponseInterface<LoginSuccessInterface>> {
    return this.http
      .post<ApiResponseInterface<LoginSuccessInterface>>(
        `${environment.apiUrl}/auth/sign-in`,
        credentials,
      )
      .pipe(
        tap((res) => {
          this._saveSession(res.data, remember);
          this._emitLogged();
          this.scheduleTokenRefresh();
        }),
      );
  }

  logout(): void {
    const session = this._getSession();
    if (!session) {
      this._clearAndRedirect();
      return;
    }

    const body: LogOutInterface = {
      userId: session.user.id,
      accessToken: session.tokens.accessToken,
      accessSessionId: session.accessSessionId,
    };

    this.http
      .post<unknown>(`${environment.apiUrl}/auth/sign-out`, body)
      .subscribe({ next: () => this._clearAndRedirect(), error: () => this._clearAndRedirect() });
  }

  refreshToken(refreshToken: string): Observable<ApiResponseInterface<LoginSuccessInterface>> {
    return this.http
      .post<ApiResponseInterface<LoginSuccessInterface>>(
        `${environment.apiUrl}/auth/refresh-token`,
        { refreshToken },
      )
      .pipe(
        tap((res) => {
          const session = this._getSession();
          if (session && res.data.tokens) {
            session.tokens = res.data.tokens;
            this._saveSession(session, session._remember);
          }
        }),
      );
  }

  getAccessToken(): string | null {
    return this._getSession()?.tokens.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this._getSession()?.tokens.refreshToken ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser(): LoginSuccessInterface['user'] | null {
    return this._getSession()?.user ?? null;
  }

  scheduleTokenRefresh(): void {
    this._clearTimer();
    const token = this.getRefreshToken();
    if (!token) return;

    const decoded = this._decodeJwt(token);
    if (!decoded?.exp) return;

    const refreshAt = decoded.exp * 1000 - 30 * 60 * 1000;
    const delay = refreshAt - Date.now();

    if (delay <= 0) {
      this._proactiveRefresh();
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.refreshTimer = setTimeout(() => this._proactiveRefresh(), delay);
    });
  }

  private _proactiveRefresh(): void {
    const token = this.getRefreshToken();
    if (!token) return;

    const decoded = this._decodeJwt(token);
    if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
      this._clearAndRedirect();
      return;
    }

    this.refreshToken(token).subscribe({
      next: () => this.scheduleTokenRefresh(),
      error: () => this._clearAndRedirect(),
    });
  }

  private _saveSession(data: LoginSuccessInterface, remember: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const stored: StoredSession = { ...data, _remember: remember };
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(this.SESSION_KEY, JSON.stringify(stored));
  }

  private _getSession(): StoredSession | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw =
      localStorage.getItem(this.SESSION_KEY) ??
      sessionStorage.getItem(this.SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  }

  clearSessionAndRedirect(): void {
    this._clearAndRedirect();
  }

  private _clearAndRedirect(): void {
    this._clearTimer();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
    }
    this._emitLogged();
    this.router.navigate(['/auth/login']);
  }

  private _emitLogged(): void {
    this._isLogged.next(this.isAuthenticated());
  }

  private _clearTimer(): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private _decodeJwt(token: string): { exp?: number } | null {
    try {
      return JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    } catch {
      return null;
    }
  }
}
