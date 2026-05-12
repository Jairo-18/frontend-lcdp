import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { CatalogNavbarComponent } from '../../components/catalog-navbar/catalog-navbar.component';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminSidebarComponent, CatalogNavbarComponent],
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
})
export class DefaultLayoutComponent {
  isAdmin = false;

  constructor(private router: Router) {}

  onExitAdmin(): void {
    this.isAdmin = false;
    this.router.navigate(['/']);
  }
}
