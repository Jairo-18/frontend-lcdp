import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationsService } from '@shared/services/notifications.service';
import { Notification } from '@shared/interfaces/notification.interface';

interface ActiveToast extends Notification {
  removing: boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
})
export class ToastComponent implements OnInit, OnDestroy {
  private readonly _notificationsService: NotificationsService =
    inject(NotificationsService);
  private readonly _platformId = inject(PLATFORM_ID);
  private sub = new Subscription();

  toasts = signal<ActiveToast[]>([]);

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    this.sub.add(
      this._notificationsService.notifications$.subscribe((n) => {
        this.toasts.update((prev) => [...prev, { ...n, removing: false }]);
        setTimeout(() => this.remove(n.id), 4000);
      }),
    );
  }

  remove(id: number): void {
    this.toasts.update((prev) => prev.filter((t) => t.id !== id));
  }

  toastClasses(toast: ActiveToast): string {
    const base = 'border';
    const map: Record<string, string> = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    return `${base} ${map[toast.type] ?? map['info']}`;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
