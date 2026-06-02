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
import { NotificationsService } from '@shared/services/notifications.service';
import { ImagePreviewService } from '@shared/services/image-preview.service';
import { ImagePreviewComponent } from '@shared/components';
import { Product } from '@shared/interfaces/product.interface';
import { TitleCaseEsPipe } from '@shared/pipes/title-case-es.pipe';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [RouterModule, TitleCaseEsPipe, ImagePreviewComponent],
  templateUrl: './producto.component.html',
})
export class ProductoComponent implements OnInit, OnDestroy {
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _productService: ProductService = inject(ProductService);
  private readonly _domSanitizer: DomSanitizer = inject(DomSanitizer);
  private readonly _platformId: object = inject(PLATFORM_ID);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _organizationalService: OrganizationalService = inject(
    OrganizationalService,
  );
  private readonly _cartService: CartService = inject(CartService);
  private readonly _notificationService: NotificationsService =
    inject(NotificationsService);
  readonly _previewSvc: ImagePreviewService = inject(ImagePreviewService);
  private readonly _titleCase = new TitleCaseEsPipe();

  readonly loading = signal(true);
  readonly product = signal<Product | null>(null);
  readonly selectedPres = signal(0);
  readonly selectedImage = signal(0);
  readonly selectedColorId = signal<number | null>(null);
  readonly qty = signal(1);
  readonly addedFeedback = signal(false);
  readonly expandedPanels = signal<Set<string>>(new Set());

  readonly subtotal = computed(() => {
    const price = this.webPrice();
    return price != null ? price * this.qty() : null;
  });

  ngOnInit(): void {
    this._activatedRoute.params
      .pipe(takeUntil(this._destroy$))
      .subscribe((params) => {
        const id = Number(params['id']);
        if (id) this._load(id);
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  selectColor(id: number): void {
    this.selectedColorId.update(cur => cur === id ? null : id);
  }

  selectedColorName(p: Product): string {
    const id = this.selectedColorId();
    return p.colors?.find(c => c.id === id)?.name ?? '';
  }

  private _load(id: number): void {
    this.loading.set(true);
    this.qty.set(1);
    this.selectedColorId.set(null);
    if (isPlatformBrowser(this._platformId)) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    this._productService
      .getPublicOne(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (p) => {
          this.product.set(p);
          this.loading.set(false);
        },
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

  openImagePreview(index = 0): void {
    const imgs = this.currentImages().map(img => img.variants.lg);
    if (imgs.length) this._previewSvc.open(imgs, index);
  }

  incQty(): void {
    this.qty.update((q) => q + 1);
  }
  decQty(): void {
    if (this.qty() > 1) this.qty.update((q) => q - 1);
  }

  addToCart(): void {
    const p = this.product();
    const price = this.webPrice();
    if (!p || price == null) return;
    const pres = p.presentations[this.selectedPres()];
    const colorId = this.selectedColorId();
    const selectedColor = colorId != null ? (p.colors ?? []).find(c => c.id === colorId) ?? null : null;
    this._cartService.addItem(
      {
        productId: p.id,
        productName: p.name,
        brandName: p.brand.name,
        productCode: p.code ?? null,
        presentationId: pres?.id ?? -1,
        presentationName: pres?.unitOfMeasure.name ?? '',
        sku: pres?.sku ?? null,
        unitPrice: price,
        imageUrl: pres?.images[0]?.variants?.thumb ?? null,
        colorId: selectedColor?.id ?? null,
        colorName: selectedColor?.name ?? null,
        colorHex: selectedColor?.hex ?? null,
      },
      this.qty(),
    );
    const qty = this.qty();
    const name = this._titleCase.transform(p.name);
    const msg = qty > 1
      ? `${qty} unidades de ${name} agregadas al carrito`
      : `1 unidad de ${name} agregada al carrito`;
    this._notificationService.success(msg);
    this.addedFeedback.set(true);
    setTimeout(() => this.addedFeedback.set(false), 1800);
  }

  get whatsappHref(): string {
    const p = this.product();
    const price = this.webPrice();
    const org = this._organizationalService.org();
    const num = (org?.whatsappNumber ?? '').replace(/\D/g, '');
    if (!num || !p || price == null) return '#';
    const pres = p.presentations[this.selectedPres()];
    const presName = pres?.unitOfMeasure.name ?? '';
    const sku = pres?.sku ? ` · REF ${pres.sku}` : '';
    const code = p.code ? ` · Cód. ${p.code}` : '';
    const total = this._cartService.fmt(price * this.qty());
    const colorId = this.selectedColorId();
    const selectedColor = colorId != null ? (p.colors ?? []).find(c => c.id === colorId) : null;
    const colorLine = selectedColor ? `   Color: ${selectedColor.name}` : null;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    const lines = [
      `${greeting} 🎨`,
      '',
      'Me gustaría hacer el siguiente pedido:',
      '',
      `📦 ${p.name}${sku}${code}`,
      `   ${presName ? `Presentación: ${presName} ×` : 'Cantidad:'} ${this.qty()} — ${total}`,
      colorLine,
      '',
      '¡Muchas gracias! 🙏',
    ].filter(l => l !== null);
    const msg = lines.join('\n');
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
    return this._cartService.fmt(value);
  }

  formatPriceFull(value: number | null): string {
    if (value == null) return '';
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' COP';
  }

  unitName(): string {
    const p = this.product();
    return p?.presentations[this.selectedPres()]?.unitOfMeasure?.name ?? '';
  }

  togglePanel(key: string): void {
    this.expandedPanels.update(s => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  isPanelOpen(key: string): boolean {
    return this.expandedPanels().has(key);
  }

  private readonly _pdfUrlCache = new Map<string, SafeResourceUrl>();

  safePdfUrl(url: string): SafeResourceUrl {
    if (!this._pdfUrlCache.has(url)) {
      this._pdfUrlCache.set(url, this._domSanitizer.bypassSecurityTrustResourceUrl(url));
    }
    return this._pdfUrlCache.get(url)!;
  }

  safeVideoUrl(): SafeResourceUrl | null {
    const url = this.product()?.videoUrl;
    if (!url) return null;
    const m = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    );
    if (!m) return null;
    return this._domSanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${m[1]}`,
    );
  }

}
