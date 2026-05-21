import { ApplicationConfig, APP_INITIALIZER, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from '@shared/interceptors/auth.interceptor';
import { notificationsInterceptor } from '@shared/interceptors/notifications.interceptor';
import { CacheRouteReuseStrategy } from '@shared/strategies/cache-route-reuse.strategy';
import { OrganizationalService } from '@shared/services/organizational.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    CacheRouteReuseStrategy,
    { provide: RouteReuseStrategy, useExisting: CacheRouteReuseStrategy },
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, notificationsInterceptor]),
    ),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const orgService = inject(OrganizationalService);
        return (): Promise<void> =>
          firstValueFrom(orgService.bootstrap())
            .then(() => {})
            .catch(() => orgService.markReady());
      },
      multi: true,
    },
  ],
};
