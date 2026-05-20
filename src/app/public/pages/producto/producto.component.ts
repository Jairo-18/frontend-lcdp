import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductService } from '@shared/services/product.service';
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
  private readonly _destroy$   = new Subject<void>();

  readonly loading        = signal(true);
  readonly product        = signal<Product | null>(null);
  readonly selectedPres   = signal(0);
  readonly selectedImage  = signal(0);

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
    window.scrollTo({ top: 0, behavior: 'instant' });
    this._productSvc.getPublicOne(id).pipe(takeUntil(this._destroy$)).subscribe({
      next: (p) => { this.product.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  selectPres(i: number): void {
    this.selectedPres.set(i);
    this.selectedImage.set(0);
  }

  selectImage(i: number): void {
    this.selectedImage.set(i);
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
    return '$' + new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
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
