import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../../default-layout/components/admin-sidebar/admin-sidebar.component';
import { ImagePreviewComponent } from '@shared/components';
import { AuthService } from '@app/auth/services/auth.service';
import { OrganizationalService } from '@shared/services/organizational.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, ImagePreviewComponent],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent implements OnInit {
  protected readonly _authService: AuthService = inject(AuthService);
  private readonly _orgService: OrganizationalService = inject(OrganizationalService);

  readonly _isSidebarOpen: WritableSignal<boolean> = signal(false);
  readonly _logoUrl: WritableSignal<string> = signal('');

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

  ngOnInit(): void {
    this._orgService.bootstrap().subscribe({
      next: ({ org }) => this._logoUrl.set(org?.logoUrl ?? ''),
    });
  }

  toggleSidebar(): void {
    this._isSidebarOpen.update((v: boolean): boolean => !v);
  }

  closeSidebar(): void {
    this._isSidebarOpen.set(false);
  }
}
