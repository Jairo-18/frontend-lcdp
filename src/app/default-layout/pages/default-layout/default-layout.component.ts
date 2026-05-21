import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { OrganizationalService } from '@shared/services/organizational.service';
import { SeoService } from '@shared/services/seo.service';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, NavBarComponent, FooterComponent],
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
})
export class DefaultLayoutComponent implements OnInit {
  readonly _orgService: OrganizationalService = inject(OrganizationalService);
  private readonly _seo: SeoService = inject(SeoService);

  readonly _org = computed(() => this._orgService.org());

  isAdmin: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this._orgService.bootstrap().subscribe({
      next: ({ org }): void => this._seo.applyFromOrg(org),
      error: (): void => this._seo.applyFromOrg(null),
    });
  }

  onExitAdmin(): void {
    this.isAdmin = false;
    this.router.navigate(['/']);
  }
}
