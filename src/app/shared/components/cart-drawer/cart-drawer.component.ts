import { DOCUMENT } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TitleCaseEsPipe } from '@shared/pipes/title-case-es.pipe';
import { CartService } from '@shared/services/cart.service';
import { OrganizationalService } from '@shared/services/organizational.service';
import { CheckoutModalComponent } from '@shared/components/checkout-modal/checkout-modal.component';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [RouterLink, TitleCaseEsPipe, CheckoutModalComponent],
  templateUrl: './cart-drawer.component.html',
})
export class CartDrawerComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  readonly _cartService: CartService = inject(CartService);
  private readonly _organizationalService: OrganizationalService = inject(OrganizationalService);
  private readonly _document: Document = inject(DOCUMENT);

  readonly checkoutOpen = signal(false);

  ngOnChanges(): void {
    const val = this.isOpen ? 'hidden' : '';
    this._document.body.style.overflow = val;
    this._document.documentElement.style.overflow = val;
  }

  inc(productId: number, presentationId: number, qty: number): void {
    this._cartService.setQuantity(productId, presentationId, qty + 1);
  }

  dec(productId: number, presentationId: number, qty: number): void {
    this._cartService.setQuantity(productId, presentationId, qty - 1);
  }
}
