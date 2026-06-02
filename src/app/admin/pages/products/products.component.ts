import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent, SelectFieldComponent } from '@shared/components';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ProductService } from '@shared/services/product.service';
import { OrganizationalService } from '@shared/services/organizational.service';
import { ImagePreviewService } from '@shared/services/image-preview.service';
import { Product, UnitOfMeasure } from '@shared/interfaces/product.interface';
import { Category } from '@shared/interfaces/category.interface';
import { Brand } from '@shared/interfaces/brand.interface';
import { TaxType } from '@shared/interfaces/tax-type.interface';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, PaginatorComponent, SelectFieldComponent],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly _productService: ProductService = inject(ProductService);
  private readonly _organizationalService: OrganizationalService = inject(
    OrganizationalService,
  );
  private readonly _previewSvc: ImagePreviewService = inject(ImagePreviewService);
  private readonly _confirmDialog: ConfirmDialogService =
    inject(ConfirmDialogService);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly _loading = signal<boolean>(false);
  readonly _deletingId = signal<number | null>(null);
  readonly _products = signal<Product[]>([]);
  readonly _total = signal<number>(0);
  readonly _pageCount = signal<number>(0);
  readonly _page = signal<number>(1);
  readonly _perPage = signal<number>(25);
  readonly _search = signal<string>('');
  readonly _categoryFilter = signal<number | undefined>(undefined);
  readonly _brandFilter = signal<number | undefined>(undefined);
  readonly _taxTypeFilter = signal<number | undefined>(undefined);
  readonly _unitFilter = signal<number | undefined>(undefined);

  readonly _from = computed(() =>
    this._total() === 0 ? 0 : (this._page() - 1) * this._perPage() + 1,
  );
  readonly _to = computed(() =>
    Math.min(this._page() * this._perPage(), this._total()),
  );
  readonly _categories = signal<Category[]>([]);
  readonly _brands = signal<Brand[]>([]);
  readonly _taxTypes = signal<TaxType[]>([]);
  readonly _units = signal<UnitOfMeasure[]>([]);

  readonly _hasFilters = computed(
    () =>
      !!this._search() ||
      !!this._categoryFilter() ||
      !!this._brandFilter() ||
      !!this._taxTypeFilter() ||
      !!this._unitFilter(),
  );

  readonly perPageOptions = [
    { value: '10', label: '10 por página' },
    { value: '25', label: '25 por página' },
    { value: '50', label: '50 por página' },
  ];

  readonly categoryOptions = computed(() => [
    { value: '', label: 'Todas las categorías' },
    ...this._categories().map((c) => ({ value: String(c.id), label: c.name })),
  ]);

  readonly brandOptions = computed(() => [
    { value: '', label: 'Todas las marcas' },
    ...this._brands().map((b) => ({ value: String(b.id), label: b.name })),
  ]);

  readonly taxTypeOptions = computed(() => [
    { value: '', label: 'Todos los impuestos' },
    ...this._taxTypes().map((t) => ({ value: String(t.id), label: t.name })),
  ]);

  readonly unitOptions = computed(() => [
    { value: '', label: 'Todas las unidades' },
    ...this._units().map((u) => ({ value: String(u.id), label: u.name })),
  ]);

  ngOnInit(): void {
    this._search$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this._destroy$),
      )
      .subscribe((val) => {
        this._search.set(val);
        this._page.set(1);
        this._loadProducts();
      });

    this._organizationalService
      .bootstrap()
      .pipe(takeUntil(this._destroy$))
      .subscribe((bootstrap) => {
        this._categories.set(bootstrap.categories);
        this._brands.set(bootstrap.brands);
        this._taxTypes.set(bootstrap.taxTypes);
        this._units.set(bootstrap.units);
        this._loadProducts();
      });
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  }

  formatPrice(value: number | null | undefined): string {
    if (value == null) return '—';
    return '$' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(Number(value)));
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _loadProducts(): void {
    this._loading.set(true);
    this._productService
      .getAll({
        page: this._page(),
        perPage: this._perPage(),
        search: this._search() || undefined,
        categoryId: this._categoryFilter(),
        brandId: this._brandFilter(),
        taxTypeId: this._taxTypeFilter(),
        unitOfMeasureId: this._unitFilter(),
      })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          this._products.set(res.data);
          this._total.set(res.pagination.total);
          this._pageCount.set(res.pagination.pageCount);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  onSearch(value: string): void {
    this._search$.next(value);
  }

  onCategoryFilter(value: string): void {
    this._categoryFilter.set(value ? Number(value) : undefined);
    this._page.set(1);
    this._loadProducts();
  }

  onBrandFilter(value: string): void {
    this._brandFilter.set(value ? Number(value) : undefined);
    this._page.set(1);
    this._loadProducts();
  }

  onTaxTypeFilter(value: string): void {
    this._taxTypeFilter.set(value ? Number(value) : undefined);
    this._page.set(1);
    this._loadProducts();
  }

  onUnitFilter(value: string): void {
    this._unitFilter.set(value ? Number(value) : undefined);
    this._page.set(1);
    this._loadProducts();
  }

  onPerPageChange(value: string): void {
    this._perPage.set(Number(value));
    this._page.set(1);
    this._loadProducts();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this._pageCount() || page === this._page()) return;
    this._page.set(page);
    this._loadProducts();
  }

  clearFilters(): void {
    this._search.set('');
    this._categoryFilter.set(undefined);
    this._brandFilter.set(undefined);
    this._taxTypeFilter.set(undefined);
    this._unitFilter.set(undefined);
    this._page.set(1);
    this._loadProducts();
  }

  productThumb(product: Product): string | null {
    return product.presentations[0]?.images[0]?.variants.thumb ?? null;
  }

  productUnits(product: Product): string {
    const names = [...new Set(product.presentations.map((p) => p.unitOfMeasure?.name).filter(Boolean))];
    return names.join(', ') || '—';
  }

  openProductPreview(product: Product): void {
    const urls = product.presentations.flatMap((p) =>
      p.images.map((img) => img.variants.md),
    );
    this._previewSvc.open(urls);
  }

  openCreate(): void {
    this._router.navigate(['/admin/products/create-or-edit-products']);
  }

  openEdit(product: Product): void {
    this._router.navigate([
      '/admin/products/create-or-edit-products',
      product.id,
    ]);
  }

  confirmDelete(id: number, name: string): void {
    this._confirmDialog.confirmDelete(name).subscribe((confirmed) => {
      if (confirmed) this.doDelete(id);
    });
  }

  private doDelete(id: number): void {
    this._deletingId.set(id);
    this._productService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this._deletingId.set(null);
          if (this._products().length === 1 && this._page() > 1)
            this._page.update((p) => p - 1);
          this._loadProducts();
        },
        error: () => this._deletingId.set(null),
      });
  }
}
