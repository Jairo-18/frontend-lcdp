import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AdminSidebarComponent } from '../../default-layout/components/admin-sidebar/admin-sidebar.component';
import { ImagePreviewComponent } from '@shared/components';
import { ImageEditorComponent } from '@shared/components/image-editor/image-editor.component';
import { AuthService } from '@app/auth/services/auth.service';
import { OrganizationalService } from '@shared/services/organizational.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, ImagePreviewComponent, ImageEditorComponent],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent implements OnInit {
  protected readonly _authService: AuthService = inject(AuthService);
  private readonly _orgService: OrganizationalService = inject(OrganizationalService);
  private readonly _router: Router = inject(Router);

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
    this._router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((): void => this.closeSidebar());
  }

  toggleSidebar(): void {
    this._isSidebarOpen.update((v: boolean): boolean => !v);
  }

  closeSidebar(): void {
    this._isSidebarOpen.set(false);
  }
}
