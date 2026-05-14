import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  signal,
  WritableSignal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

interface NavLink {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-nav-bar-mobile',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar-mobile.component.html',
  styleUrl: './nav-bar-mobile.component.scss',
})
export class NavBarMobileComponent implements OnInit, OnDestroy {
  private readonly _router: Router = inject(Router);
  private readonly _platformId: object = inject(PLATFORM_ID);

  @Input() cartCount: number = 0;
  @Output() openCart: EventEmitter<void> = new EventEmitter<void>();
  @Output() goHome: EventEmitter<void> = new EventEmitter<void>();

  readonly _isMenuOpen: WritableSignal<boolean> = signal(false);

  readonly navLinks: NavLink[] = [
    { label: 'Inicio',   icon: 'home',          route: '/' },
    { label: 'Catálogo', icon: 'format_paint',  route: '/catalogo' },
    { label: 'Videos',   icon: 'smart_display', route: '/videos' },
    { label: 'Nosotros', icon: 'info',           route: '/about-us' },
  ];

  ngOnInit(): void {
    this._router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((): void => this.closeMenu());
  }

  ngOnDestroy(): void {
    this._setBodyScroll(true);
  }

  toggleMenu(): void {
    const next: boolean = !this._isMenuOpen();
    this._isMenuOpen.set(next);
    this._setBodyScroll(!next);
  }

  closeMenu(): void {
    this._isMenuOpen.set(false);
    this._setBodyScroll(true);
  }

  private _setBodyScroll(enabled: boolean): void {
    if (!isPlatformBrowser(this._platformId)) return;
    document.body.style.overflow = enabled ? '' : 'hidden';
  }
}
