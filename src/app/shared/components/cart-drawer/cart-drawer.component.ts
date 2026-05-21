import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CartService } from '@shared/services/cart.service';
import { OrganizationalService } from '@shared/services/organizational.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [],
  templateUrl: './cart-drawer.component.html',
})
export class CartDrawerComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  readonly cartSvc = inject(CartService);
  private readonly _orgSvc = inject(OrganizationalService);

  get whatsappHref(): string {
    const org = this._orgSvc.org();
    const num = (org?.whatsappNumber ?? '').replace(/\D/g, '');
    if (!num || !this.cartSvc.count()) return '#';
    const msg = this.cartSvc.buildMessage();
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  inc(productId: number, presentationId: number, qty: number): void {
    this.cartSvc.setQuantity(productId, presentationId, qty + 1);
  }

  dec(productId: number, presentationId: number, qty: number): void {
    this.cartSvc.setQuantity(productId, presentationId, qty - 1);
  }
}
