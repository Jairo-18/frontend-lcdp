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
  private readonly _platformId: object = inject(PLATFORM_ID);
  private readonly _breakpointObserver: BreakpointObserver = inject(
    BreakpointObserver,
  );
  private readonly _titleCasePipe: TitleCaseEsPipe = new TitleCaseEsPipe();

  name: string = '';
  phone: string = '';
  address: string = '';
  notes: string = '';
  paymentMethod: 'addi' | 'sistecredito' | 'contado' = 'contado';

  readonly paymentOptions = [
    { value: 'addi' as const, emoji: '💳', label: 'Addi (cuotas)' },
    { value: 'sistecredito' as const, emoji: '💰', label: 'Sistecredito' },
    { value: 'contado' as const, emoji: '✅', label: 'De contado' },
  ];

  private get _greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }

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
    const payLabel = this.paymentOptions.find(o => o.value === this.paymentMethod)?.label ?? 'De contado';

    const lines: string[] = [
      `${this._greeting} 🎨`,
      ``,
      `Mi nombre es *${n}*, mi celular es *${p}*. Quiero comprar los siguientes productos por medio de pago *${payLabel}*:`,
      ``,
    ];

    this._cartService.items().forEach((it) => {
      const ref = it.productCode ? ` · Cód. ${it.productCode}` : (it.sku ? ` · Ref ${it.sku}` : '');
      const color = it.colorName ? ` · Color: ${it.colorName}` : '';
      lines.push(
        `• ${this._titleCasePipe.transform(it.productName)}${ref} (${it.presentationName}${color}) x${it.quantity} — ${this._cartService.fmt(it.unitPrice * it.quantity)}`,
      );
    });

    lines.push(
      ``,
      `*Total estimado: ${this._cartService.fmt(this._cartService.subtotal())}*`,
    );
    if (addr) lines.push(``, `📍 Dirección de entrega: ${addr}`);
    if (nt) lines.push(`📝 Notas: ${nt}`);
    lines.push(``, `¡Muchas gracias! 🙏`);
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

    const payLabel = this.paymentOptions.find(o => o.value === this.paymentMethod)?.label ?? '';
    const msg = this._cartService.buildCheckoutMessage({
      name: this.name.trim(),
      phone: this.phone.trim(),
      address: this.address.trim(),
      notes: this.notes.trim(),
      greeting: this._greeting,
      paymentMethod: payLabel,
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
