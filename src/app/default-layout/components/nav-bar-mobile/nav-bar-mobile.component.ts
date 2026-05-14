import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-bar-mobile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-bar-mobile.component.html',
  styleUrl: './nav-bar-mobile.component.scss',
})
export class NavBarMobileComponent {
  @Input() cartCount = 0;
  @Output() openMenu = new EventEmitter<void>();
  @Output() openCart = new EventEmitter<void>();
  @Output() goHome = new EventEmitter<void>();
}
