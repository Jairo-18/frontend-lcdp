import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly platformId = inject(PLATFORM_ID);
  private _counter = 0;

  readonly notifications$ = new Subject<Notification>();

  show(type: NotificationType, message: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.notifications$.next({ id: ++this._counter, type, message });
  }

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }
}
