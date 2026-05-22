import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cart-popover',
  standalone: true,
  imports: [NgClass],
  templateUrl: './cart-popover.component.html',
})
export class CartPopoverComponent {
  @Input() count: number = 0;
  @Input() arrowRight: string = 'right-5';
}
