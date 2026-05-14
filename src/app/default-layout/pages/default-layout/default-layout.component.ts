import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, NavBarComponent, FooterComponent],
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
