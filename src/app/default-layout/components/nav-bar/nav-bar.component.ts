import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NavBarDestokComponent } from '../nav-bar-destok/nav-bar-destok.component';
import { NavBarMobileComponent } from '../nav-bar-mobile/nav-bar-mobile.component';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [NavBarDestokComponent, NavBarMobileComponent],
  templateUrl: './nav-bar.component.html',
})
export class NavBarComponent {
  @Input() cartCount: number = 0;
  @Output() openMenu = new EventEmitter<void>();
  @Output() openCart = new EventEmitter<void>();
  @Output() goHome = new EventEmitter<void>();
}
