import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injector, runInInjectionContext } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '@app/auth/services/auth.service';
import { NotificationsService } from '@shared/services/notifications.service';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';
import { LoginSuccessInterface } from '@shared/interfaces/login.interface';
import { environment } from '@env/environment';

const tokenSubject = new BehaviorSubject<string>('');

const buildRequest = (
  req: HttpRequest<unknown>,
  token: string,
): HttpRequest<unknown> =>
  req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'X-Client-Key': environment.apiKey,
    },
  });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const _authService: AuthService = inject(AuthService);
  const _notificationsService: NotificationsService =
    inject(NotificationsService);
  const injector = inject(Injector);

  const authReq = buildRequest(req, _authService.getAccessToken() ?? '');

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const refreshToken = _authService.getRefreshToken();

      switch (err.status) {
        case 401: {
          if (refreshToken && !_authService.isRefreshing) {
            _authService.isRefreshing = true;
            tokenSubject.next('');

            return _authService.refreshToken(refreshToken).pipe(
              switchMap((res: ApiResponseInterface<LoginSuccessInterface>) => {
                _authService.isRefreshing = false;
                const newToken = res.data?.tokens?.accessToken ?? '';
                tokenSubject.next(newToken);
                return next(
                  runInInjectionContext(injector, () =>
                    buildRequest(authReq, newToken),
                  ),
                );
              }),
              catchError((refreshErr) => {
                _authService.isRefreshing = false;
                _notificationsService.error(
                  'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
                );
                _authService.clearSessionAndRedirect();
                return throwError(() => refreshErr);
              }),
            );
          }

          if (
            refreshToken &&
            _authService.isRefreshing &&
            !req.url.includes('refresh-token')
          ) {
            return tokenSubject.pipe(
              filter((token) => token !== ''),
              take(1),
              switchMap((token) =>
                next(
                  runInInjectionContext(injector, () =>
                    buildRequest(authReq, token),
                  ),
                ),
              ),
            );
          }

          const hadSession = !!_authService.getAccessToken() || !!refreshToken;
          if (hadSession) {
            _notificationsService.error(
              'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            );
            _authService.clearSessionAndRedirect();
          }
          return throwError(() => err);
        }

        case 403:
          _notificationsService.error(
            'No tienes permisos para realizar esta acción.',
          );
          return throwError(() => err);

        default:
          return throwError(() => err);
      }
    }),
  );
};
