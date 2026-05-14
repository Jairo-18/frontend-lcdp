import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../../default-layout/components/admin-sidebar/admin-sidebar.component';
import { AuthService } from '@app/auth/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent],
  template: `
    <div class="flex min-h-screen bg-paper">
      <app-admin-sidebar
        [userName]="userName"
        [userInitials]="initials"
        (exitAdmin)="auth.logout()"
      />
      <main class="flex-1 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  protected auth = inject(AuthService);

  get userName(): string {
    return this.auth.getCurrentUser()?.fullName ?? 'Admin';
  }

  get initials(): string {
    return (this.auth.getCurrentUser()?.fullName ?? 'AD')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
