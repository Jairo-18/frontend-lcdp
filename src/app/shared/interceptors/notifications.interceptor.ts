import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { NotificationsService } from '@shared/services/notifications.service';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';

const SILENT_URL_PATTERNS = ['/auth/'];

const isSilent = (url: string): boolean =>
  SILENT_URL_PATTERNS.some((pattern) => url.includes(pattern));

export const notificationsInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationsService = inject(NotificationsService);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && !isSilent(req.url)) {
        const body = event.body as ApiResponseInterface<unknown> | null;
        if (body?.message) {
          notificationsService.success(body.message);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (!isSilent(req.url) && error.status !== 401 && error.status !== 403) {
        const message = (error.error as ApiResponseInterface<unknown>)?.message
          ?? 'Ha ocurrido un error inesperado.';
        notificationsService.error(message);
      }
      return throwError(() => error);
    }),
  );
};
