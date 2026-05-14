import { Injectable, inject, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';
import {
  LoginCredentials,
  LoginSuccessInterface,
  LoginUser,
} from '@shared/interfaces/login.interface';
import { LogOutInterface } from '@shared/interfaces/logout.interface';

type StoredSession = LoginSuccessInterface & { _remember: boolean };
type JwtPayload = { exp?: number };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _platformId: object = inject(PLATFORM_ID);
  private readonly _ngZone: NgZone = inject(NgZone);
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _router: Router = inject(Router);

  private readonly _sessionKey: string = '_lcdp_session';
  private _refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private _isRefreshing: boolean = false;

  private readonly _isLogged: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(this.isAuthenticated());
  readonly isLogged$: Observable<boolean> = this._isLogged.asObservable();

  constructor() {
    if (this.isAuthenticated()) this.scheduleTokenRefresh();
  }

  get isRefreshing(): boolean {
    return this._isRefreshing;
  }

  set isRefreshing(value: boolean) {
    this._isRefreshing = value;
  }

  login(
    credentials: LoginCredentials,
    remember: boolean,
  ): Observable<ApiResponseInterface<LoginSuccessInterface>> {
    return this._httpClient
      .post<
        ApiResponseInterface<LoginSuccessInterface>
      >(`${environment.apiUrl}/auth/sign-in`, credentials)
      .pipe(
        tap((res: ApiResponseInterface<LoginSuccessInterface>): void => {
          this._saveSession(res.data, remember);
          this._emitLogged();
          this.scheduleTokenRefresh();
        }),
      );
  }

  logout(): void {
    const session: StoredSession | null = this._getSession();
    if (!session) {
      this._clearAndRedirect();
      return;
    }

    const body: LogOutInterface = {
      userId: session.user.id,
      accessToken: session.tokens.accessToken,
      accessSessionId: session.accessSessionId,
    };

    this._httpClient
      .post<unknown>(`${environment.apiUrl}/auth/sign-out`, body)
      .subscribe({
        next: (): void => this._clearAndRedirect(),
        error: (): void => this._clearAndRedirect(),
      });
  }

  refreshToken(
    refreshToken: string,
  ): Observable<ApiResponseInterface<LoginSuccessInterface>> {
    return this._httpClient
      .post<
        ApiResponseInterface<LoginSuccessInterface>
      >(`${environment.apiUrl}/auth/refresh-token`, { refreshToken })
      .pipe(
        tap((res: ApiResponseInterface<LoginSuccessInterface>): void => {
          const session: StoredSession | null = this._getSession();
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

  getCurrentUser(): LoginUser | null {
    return this._getSession()?.user ?? null;
  }

  scheduleTokenRefresh(): void {
    this._clearTimer();
    const token: string | null = this.getRefreshToken();
    if (!token) return;

    const decoded: JwtPayload | null = this._decodeJwt(token);
    if (!decoded?.exp) return;

    const refreshAt: number = decoded.exp * 1000 - 30 * 60 * 1000;
    const delay: number = refreshAt - Date.now();

    if (delay <= 0) {
      this._proactiveRefresh();
      return;
    }

    this._ngZone.runOutsideAngular((): void => {
      this._refreshTimer = setTimeout(
        (): void => this._proactiveRefresh(),
        delay,
      );
    });
  }

  clearSessionAndRedirect(): void {
    this._clearAndRedirect();
  }

  private _proactiveRefresh(): void {
    const token: string | null = this.getRefreshToken();
    if (!token) return;

    const decoded: JwtPayload | null = this._decodeJwt(token);
    if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
      this._clearAndRedirect();
      return;
    }

    this.refreshToken(token).subscribe({
      next: (): void => this.scheduleTokenRefresh(),
      error: (): void => this._clearAndRedirect(),
    });
  }

  private _saveSession(data: LoginSuccessInterface, remember: boolean): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const stored: StoredSession = { ...data, _remember: remember };
    const storage: Storage = remember ? localStorage : sessionStorage;
    storage.setItem(this._sessionKey, JSON.stringify(stored));
  }

  private _getSession(): StoredSession | null {
    if (!isPlatformBrowser(this._platformId)) return null;
    const raw: string | null =
      localStorage.getItem(this._sessionKey) ??
      sessionStorage.getItem(this._sessionKey);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  }

  private _clearAndRedirect(): void {
    this._clearTimer();
    if (isPlatformBrowser(this._platformId)) {
      localStorage.removeItem(this._sessionKey);
      sessionStorage.removeItem(this._sessionKey);
    }
    this._emitLogged();
    this._router.navigate(['/auth/login']);
  }

  private _emitLogged(): void {
    this._isLogged.next(this.isAuthenticated());
  }

  private _clearTimer(): void {
    if (this._refreshTimer !== null) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  private _decodeJwt(token: string): JwtPayload | null {
    try {
      return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  }
}
