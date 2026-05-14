import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  count?: number;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent implements OnDestroy {
  private readonly _platformId: object = inject(PLATFORM_ID);

  @Input() userName: string = 'Admin';
  @Input() userRole: string = 'Administrador';
  @Input() userInitials: string = 'AD';
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
    if (isPlatformBrowser(this._platformId)) {
      document.body.style.overflow = value ? 'hidden' : '';
    }
  }
  get isOpen(): boolean { return this._isOpen; }

  @Output() exitAdmin: EventEmitter<void> = new EventEmitter<void>();
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  private _isOpen: boolean = false;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',        route: '/admin/dashboard'  },
    { label: 'Aplicación', icon: 'app_settings_alt', route: '/admin/aplication' },
  ];

  ngOnDestroy(): void {
    if (isPlatformBrowser(this._platformId)) {
      document.body.style.overflow = '';
    }
  }
}
