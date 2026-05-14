import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injector, runInInjectionContext } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '@app/auth/services/auth.service';
import { NotificationsService } from '@shared/services/notifications.service';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';
import { LoginSuccessInterface } from '@shared/interfaces/login.interface';
import { environment } from '@env/environment';

const tokenSubject = new BehaviorSubject<string>('');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationsService = inject(NotificationsService);
  const injector = inject(Injector);

  const authReq = addTokenToRequest(req);

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const refreshToken = authService.getRefreshToken();

      switch (err.status) {
        case 401: {
          if (refreshToken && !authService.isRefreshing) {
            authService.isRefreshing = true;
            tokenSubject.next('');

            return authService.refreshToken(refreshToken).pipe(
              switchMap((res: ApiResponseInterface<LoginSuccessInterface>) => {
                authService.isRefreshing = false;
                const newToken = res.data?.tokens?.accessToken ?? '';
                tokenSubject.next(newToken);
                return next(
                  runInInjectionContext(injector, () =>
                    addTokenToRequest(authReq, newToken),
                  ),
                );
              }),
              catchError((refreshErr) => {
                authService.isRefreshing = false;
                notificationsService.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                authService.clearSessionAndRedirect();
                return throwError(() => refreshErr);
              }),
            );
          }

          if (refreshToken && authService.isRefreshing && !req.url.includes('refresh-token')) {
            return tokenSubject.pipe(
              filter((token) => token !== ''),
              take(1),
              switchMap((token) =>
                next(
                  runInInjectionContext(injector, () =>
                    addTokenToRequest(authReq, token),
                  ),
                ),
              ),
            );
          }

          const hadSession = !!authService.getAccessToken() || !!refreshToken;
          if (hadSession) {
            notificationsService.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            authService.clearSessionAndRedirect();
          }
          return throwError(() => err);
        }

        case 403:
          notificationsService.error('No tienes permisos para realizar esta acción.');
          return throwError(() => err);

        default:
          return throwError(() => err);
      }
    }),
  );
};

const addTokenToRequest = (
  req: HttpRequest<unknown>,
  token?: string,
): HttpRequest<unknown> => {
  const authService = inject(AuthService);
  const accessToken = token ?? authService.getAccessToken() ?? '';

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
      'X-Api-Key': environment.apiKey,
    },
  });
};
