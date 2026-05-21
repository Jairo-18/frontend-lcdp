import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  signal,
  computed,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductService } from '@shared/services/product.service';
import { OrganizationalService } from '@shared/services/organizational.service';
import { CartService } from '@shared/services/cart.service';
import { Product } from '@shared/interfaces/product.interface';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './producto.component.html',
})
export class ProductoComponent implements OnInit, OnDestroy {
  private readonly _route      = inject(ActivatedRoute);
  private readonly _productSvc = inject(ProductService);
  private readonly _sanitizer  = inject(DomSanitizer);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _destroy$   = new Subject<void>();
  private readonly _orgSvc     = inject(OrganizationalService);

  readonly cartSvc = inject(CartService);

  readonly loading        = signal(true);
  readonly product        = signal<Product | null>(null);
  readonly selectedPres   = signal(0);
  readonly selectedImage  = signal(0);
  readonly qty            = signal(1);
  readonly addedFeedback  = signal(false);

  readonly subtotal = computed(() => {
    const price = this.webPrice();
    return price != null ? price * this.qty() : null;
  });

  ngOnInit(): void {
    this._route.params.pipe(takeUntil(this._destroy$)).subscribe(params => {
      const id = Number(params['id']);
      if (id) this._load(id);
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _load(id: number): void {
    this.loading.set(true);
    this.qty.set(1);
    if (isPlatformBrowser(this._platformId)) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    this._productSvc.getPublicOne(id).pipe(takeUntil(this._destroy$)).subscribe({
      next: (p) => { this.product.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  selectPres(i: number): void {
    this.selectedPres.set(i);
    this.selectedImage.set(0);
    this.qty.set(1);
  }

  selectImage(i: number): void {
    this.selectedImage.set(i);
  }

  incQty(): void { this.qty.update(q => q + 1); }
  decQty(): void { if (this.qty() > 1) this.qty.update(q => q - 1); }

  addToCart(): void {
    const p = this.product();
    const price = this.webPrice();
    if (!p || price == null) return;
    const pres = p.presentations[this.selectedPres()];
    this.cartSvc.addItem({
      productId: p.id,
      productName: p.name,
      brandName: p.brand.name,
      presentationId: pres?.id ?? -1,
      presentationName: pres?.unitOfMeasure.name ?? '',
      sku: pres?.sku ?? null,
      unitPrice: price,
    }, this.qty());
    this.addedFeedback.set(true);
    setTimeout(() => this.addedFeedback.set(false), 1800);
  }

  get whatsappHref(): string {
    const p = this.product();
    const price = this.webPrice();
    const org = this._orgSvc.org();
    const num = (org?.whatsappNumber ?? '').replace(/\D/g, '');
    if (!num || !p || price == null) return '#';
    const pres = p.presentations[this.selectedPres()];
    const presName = pres?.unitOfMeasure.name ?? '';
    const total = this.cartSvc.fmt(price * this.qty());
    const msg = [
      '¡Hola! Me gustaría pedir:',
      '',
      `• ${p.name}${presName ? ` (${presName})` : ''} x${this.qty()} — ${total}`,
    ].join('\n');
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  currentImages() {
    const p = this.product();
    return p?.presentations[this.selectedPres()]?.images ?? [];
  }

  webPrice(): number | null {
    const p = this.product();
    if (!p) return null;
    const base = p.presentations[this.selectedPres()]?.priceSale ?? p.priceSale;
    if (base == null) return null;
    const markup = p.markupPercentage ?? 0;
    return Number(base) * (1 + markup / 100);
  }

  formatPrice(value: number | null): string {
    if (value == null) return '—';
    return this.cartSvc.fmt(value);
  }

  unitName(): string {
    const p = this.product();
    return p?.presentations[this.selectedPres()]?.unitOfMeasure?.name ?? '';
  }

  safeVideoUrl(): SafeResourceUrl | null {
    const url = this.product()?.videoUrl;
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!m) return null;
    return this._sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${m[1]}`,
    );
  }

  techSheetEntries(): { key: string; value: string }[] {
    const sheet = this.product()?.technicalSheet;
    if (!sheet) return [];
    return Object.entries(sheet).map(([key, value]) => ({
      key, value: String(value),
    }));
  }
}
