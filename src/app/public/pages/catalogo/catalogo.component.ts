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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaginatorComponent } from '@shared/components';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductService } from '@shared/services/product.service';
import { OrganizationalService } from '@shared/services/organizational.service';
import { Product } from '@shared/interfaces/product.interface';
import { Category } from '@shared/interfaces/category.interface';
import { Brand } from '@shared/interfaces/brand.interface';

const PALETTE: readonly string[] = ['#1a56db','#d93025','#1e7e34','#7c3aed','#b45309','#0891b2'];

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [RouterModule, FormsModule, PaginatorComponent],
  templateUrl: './catalogo.component.html',
})
export class CatalogoComponent implements OnInit, OnDestroy {
  private readonly _platformId: object             = inject(PLATFORM_ID);
  private readonly _route:    ActivatedRoute       = inject(ActivatedRoute);
  private readonly _router:   Router               = inject(Router);
  private readonly _products: ProductService       = inject(ProductService);
  private readonly _orgSvc:   OrganizationalService = inject(OrganizationalService);
  private readonly _bp:       BreakpointObserver   = inject(BreakpointObserver);
  private readonly _destroy$: Subject<void>        = new Subject<void>();

  private get _pageSize(): number {
    return this._bp.isMatched('(max-width: 1023px)') ? 10 : 20;
  }

  readonly loading  = signal(true);
  readonly products = signal<Product[]>([]);
  readonly categories  = signal<Category[]>([]);
  readonly brands      = signal<Brand[]>([]);
  readonly currentPage = signal(1);
  readonly totalItems  = signal(0);
  readonly totalPages  = signal(1);

  readonly selectedCategory = signal<string | null>(null);
  readonly selectedBrand    = signal<string | null>(null);
  readonly searchQuery      = signal<string | null>(null);
  readonly orderBy          = signal<'name' | 'createdAt'>('createdAt');

  readonly hasFilters = computed(() =>
    !!this.selectedCategory() || !!this.selectedBrand() || !!this.searchQuery(),
  );

  readonly skeletons: null[] = Array<null>(12).fill(null);

  ngOnInit(): void {
    combineLatest([
      this._orgSvc.bootstrap(),
      this._route.queryParams,
    ]).pipe(takeUntil(this._destroy$))
    .subscribe(([bootstrap, params]) => {
      this.categories.set(bootstrap.categories);
      this.brands.set(bootstrap.brands);
      this.selectedCategory.set(params['categoria'] ?? null);
      this.selectedBrand.set(params['marca'] ?? null);
      this.searchQuery.set(params['q'] ?? null);
      this.currentPage.set(1);
      this._load(1);
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _load(page: number): void {
    this.loading.set(true);
    if (isPlatformBrowser(this._platformId)) window.scrollTo({ top: 0, behavior: 'smooth' });

    const catCode    = this.selectedCategory();
    const brandCode  = this.selectedBrand();
    const categoryId = catCode  ? this.categories().find(c => c.code === catCode)?.id  : undefined;
    const brandId    = brandCode ? this.brands().find(b => b.code === brandCode)?.id    : undefined;

    this._products.getPublic({
      page,
      perPage: this._pageSize,
      categoryId,
      brandId,
      search: this.searchQuery() ?? undefined,
      orderBy: this.orderBy(),
    }).pipe(takeUntil(this._destroy$))
    .subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.currentPage.set(page);
        this.totalItems.set(res.pagination.total);
        this.totalPages.set(res.pagination.pageCount || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this._load(page);
  }

  toggleCategory(code: string): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        categoria: this.selectedCategory() === code ? null : code,
        marca: this.selectedBrand() ?? null,
        q: this.searchQuery() ?? null,
      },
    });
  }

  toggleBrand(code: string): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        categoria: this.selectedCategory() ?? null,
        marca: this.selectedBrand() === code ? null : code,
        q: this.searchQuery() ?? null,
      },
    });
  }

  onCategorySelect(val: string): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        categoria: val || null,
        marca: this.selectedBrand() ?? null,
        q: this.searchQuery() ?? null,
      },
    });
  }

  onBrandSelect(val: string): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        categoria: this.selectedCategory() ?? null,
        marca: val || null,
        q: this.searchQuery() ?? null,
      },
    });
  }

  clearFilters(): void {
    this._router.navigate([], { relativeTo: this._route, queryParams: {} });
  }

  onOrderChange(val: string): void {
    this.orderBy.set(val as 'name' | 'createdAt');
    this._load(1);
  }

  webPrice(product: Product): number | null {
    const base = product.presentations[0]?.priceSale ?? product.priceSale;
    if (base == null) return null;
    const markup = product.markupPercentage ?? 0;
    return Number(base) * (1 + markup / 100);
  }

  formatPrice(value: number): string {
    return '$' + new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  }

  firstImage(product: Product): string | null {
    return product.presentations[0]?.images[0]?.variants?.thumb ?? null;
  }

  placeholderColor(index: number): string {
    return PALETTE[index % PALETTE.length];
  }

  firstSku(product: Product): string {
    return product.presentations[0]?.sku ?? '—';
  }

  pageTitle(): string {
    const q = this.searchQuery();
    if (q) return `Resultados para "${q}"`;
    const cat = this.selectedCategory();
    if (cat) return this.categories().find(c => c.code === cat)?.name ?? 'Catálogo';
    const brand = this.selectedBrand();
    if (brand) return this.brands().find(b => b.code === brand)?.name ?? 'Catálogo';
    return 'Catálogo';
  }
}
