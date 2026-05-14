import { Component, inject, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../../default-layout/components/admin-sidebar/admin-sidebar.component';
import { AuthService } from '@app/auth/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  protected readonly _authService: AuthService = inject(AuthService);

  readonly _isSidebarOpen: WritableSignal<boolean> = signal(false);

  get _userName(): string {
    return this._authService.getCurrentUser()?.fullName ?? 'Admin';
  }

  get _initials(): string {
    return (this._authService.getCurrentUser()?.fullName ?? 'AD')
      .split(' ')
      .map((w: string): string => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  toggleSidebar(): void {
    this._isSidebarOpen.update((v: boolean): boolean => !v);
  }

  closeSidebar(): void {
    this._isSidebarOpen.set(false);
  }
}
