import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { NotificationsService } from '@shared/services/notifications.service';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';

export const notificationsInterceptor: HttpInterceptorFn = (req, next) => {
  const _notificationsService: NotificationsService =
    inject(NotificationsService);

  return next(req).pipe(
    tap((event) => {
      if (
        event instanceof HttpResponse &&
        !req.url.includes('/notifications')
      ) {
        const body = event.body as ApiResponseInterface<unknown> | null;
        if (body?.message) {
          _notificationsService.success(body.message);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (
        !req.url.includes('/notifications') &&
        error.status !== 401 &&
        error.status !== 403
      ) {
        const message =
          (error.error as ApiResponseInterface<unknown>)?.message ??
          'Ha ocurrido un error inesperado.';
        _notificationsService.error(message);
      }
      return throwError(() => error);
    }),
  );
};
