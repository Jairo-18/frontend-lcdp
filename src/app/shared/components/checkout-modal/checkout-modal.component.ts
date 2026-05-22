import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  PLATFORM_ID,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TitleCaseEsPipe } from '@shared/pipes/title-case-es.pipe';
import { CartItem, CartService } from '@shared/services/cart.service';
import { OrganizationalService } from '@shared/services/organizational.service';

const WA_FALLBACK = '573102103660';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [FormsModule, TitleCaseEsPipe],
  templateUrl: './checkout-modal.component.html',
})
export class CheckoutModalComponent {
  @Input() isOpen: boolean = false;
  @Output() readonly close = new EventEmitter<void>();

  private readonly _cartService: CartService = inject(CartService);
  private readonly _organizationalService: OrganizationalService = inject(
    OrganizationalService,
  );
  private readonly _document: Document = inject(DOCUMENT);
  private readonly _platformId: Object = inject(PLATFORM_ID);
  private readonly _breakpointObserver: BreakpointObserver = inject(
    BreakpointObserver,
  );
  private readonly _titleCasePipe: TitleCaseEsPipe = new TitleCaseEsPipe();

  name: string = '';
  phone: string = '';
  address: string = '';
  notes: string = '';

  get items(): CartItem[] {
    return this._cartService.items();
  }

  fmt(amount: number): string {
    return this._cartService.fmt(amount);
  }

  get subtotalStr(): string {
    return this._cartService.fmt(this._cartService.subtotal());
  }

  get isValid(): boolean {
    return this.name.trim().length > 0 && this.phone.trim().length > 0;
  }

  get previewLines(): string[] {
    const n = this.name.trim() || '[Tu nombre]';
    const p = this.phone.trim() || '[Tu teléfono]';
    const addr = this.address.trim();
    const nt = this.notes.trim();

    const lines: string[] = [
      `🧾 *NUEVA COTIZACIÓN*`,
      ``,
      `👤 *Cliente:* ${n}`,
      `📞 *Celular:* ${p}`,
    ];
    if (addr) lines.push(`📍 *Dirección:* ${addr}`);
    lines.push(``, `📦 *Productos:*`, ``);

    this._cartService.items().forEach((it) => {
      const pres = it.sku
        ? `${it.presentationName} - ${it.sku}`
        : it.presentationName;
      lines.push(
        `• ${this._titleCasePipe.transform(it.productName)} (${pres}) x${it.quantity}`,
      );
      lines.push(`  💰 ${this._cartService.fmt(it.unitPrice * it.quantity)}`);
      lines.push('');
    });

    lines.push(
      `💵 *TOTAL ESTIMADO:*`,
      this._cartService.fmt(this._cartService.subtotal()),
    );
    if (nt) lines.push(``, `📝 *Notas:* ${nt}`);
    return lines;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/[^0-9+\s]/g, '');
    if (cleaned !== input.value) {
      input.value = cleaned;
      this.phone = cleaned;
    }
  }

  send(): void {
    if (!this.isValid || !isPlatformBrowser(this._platformId)) return;

    const msg = this._cartService.buildCheckoutMessage({
      name: this.name.trim(),
      phone: this.phone.trim(),
      address: this.address.trim(),
      notes: this.notes.trim(),
    });

    const rawNum = this._organizationalService.org()?.whatsappNumber ?? '';
    const waNumber = rawNum.replace(/\D/g, '') || WA_FALLBACK;
    const encoded = encodeURIComponent(msg);
    const isMobile = this._breakpointObserver.isMatched('(max-width: 1023px)');
    const url = isMobile
      ? `https://wa.me/${waNumber}?text=${encoded}`
      : `https://web.whatsapp.com/send?phone=${waNumber}&text=${encoded}`;

    this._document.defaultView?.open(url, '_blank');
    this.close.emit();
  }
}
