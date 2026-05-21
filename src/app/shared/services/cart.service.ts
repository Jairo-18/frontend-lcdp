import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CartItem {
  productId: number;
  productName: string;
  brandName: string;
  presentationId: number;
  presentationName: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
}

const CART_KEY = 'lcdp_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((s, i) => s + i.quantity, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  );

  constructor() {
    if (isPlatformBrowser(this._platformId)) {
      try {
        const raw = localStorage.getItem(CART_KEY);
        if (raw) this._items.set(JSON.parse(raw));
      } catch {}
    }
  }

  addItem(item: Omit<CartItem, 'quantity'>, qty: number = 1): void {
    const idx = this._items().findIndex(
      i => i.productId === item.productId && i.presentationId === item.presentationId,
    );
    if (idx >= 0) {
      this._items.update(list => {
        const copy = [...list];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      });
    } else {
      this._items.update(list => [...list, { ...item, quantity: qty }]);
    }
    this._persist();
  }

  setQuantity(productId: number, presentationId: number, qty: number): void {
    if (qty <= 0) { this.remove(productId, presentationId); return; }
    this._items.update(list =>
      list.map(i =>
        i.productId === productId && i.presentationId === presentationId
          ? { ...i, quantity: qty }
          : i,
      ),
    );
    this._persist();
  }

  remove(productId: number, presentationId: number): void {
    this._items.update(list =>
      list.filter(i => !(i.productId === productId && i.presentationId === presentationId)),
    );
    this._persist();
  }

  clear(): void {
    this._items.set([]);
    this._persist();
  }

  buildMessage(): string {
    const items = this._items();
    if (!items.length) return '';
    const lines = items.map(
      (it, i) =>
        `${i + 1}. ${it.productName} (${it.presentationName}) x${it.quantity} — ${this._fmt(it.unitPrice * it.quantity)}`,
    );
    return [
      '¡Hola! Me gustaría hacer el siguiente pedido:',
      '',
      ...lines,
      '',
      `*Total estimado: ${this._fmt(this.subtotal())}*`,
    ].join('\n');
  }

  fmt(v: number): string {
    return '$' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  }

  private _fmt(v: number): string { return this.fmt(v); }

  private _persist(): void {
    if (isPlatformBrowser(this._platformId)) {
      localStorage.setItem(CART_KEY, JSON.stringify(this._items()));
    }
  }
}
