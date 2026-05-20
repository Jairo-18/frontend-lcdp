import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { PaginatorComponent } from '@shared/components';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ProductService } from '@shared/services/product.service';
import { OrganizationalService } from '@shared/services/organizational.service';
import { ImagePreviewService } from '@shared/services/image-preview.service';
import { Product } from '@shared/interfaces/product.interface';
import { Category } from '@shared/interfaces/category.interface';
import { Brand } from '@shared/interfaces/brand.interface';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [DecimalPipe, PaginatorComponent],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly _productService: ProductService = inject(ProductService);
  private readonly _organizationalService: OrganizationalService = inject(
    OrganizationalService,
  );
  readonly _previewSvc: ImagePreviewService = inject(ImagePreviewService);
  private readonly _confirmDialog: ConfirmDialogService =
    inject(ConfirmDialogService);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly _loading = signal(false);
  readonly _deletingId = signal<number | null>(null);
  readonly _products = signal<Product[]>([]);
  readonly _total = signal(0);
  readonly _pageCount = signal(0);
  readonly _page = signal(1);
  readonly _perPage = signal(25);
  readonly _search = signal('');
  readonly _categoryFilter = signal<number | undefined>(undefined);
  readonly _brandFilter = signal<number | undefined>(undefined);

  readonly _from = computed(() =>
    this._total() === 0 ? 0 : (this._page() - 1) * this._perPage() + 1,
  );
  readonly _to = computed(() =>
    Math.min(this._page() * this._perPage(), this._total()),
  );
  readonly _categories = signal<Category[]>([]);
  readonly _brands = signal<Brand[]>([]);

  readonly _hasFilters = computed(
    () => !!this._search() || !!this._categoryFilter() || !!this._brandFilter(),
  );

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
        this._loadProducts();
      });
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
    this._page.set(1);
    this._loadProducts();
  }

  productThumb(product: Product): string | null {
    return product.presentations[0]?.images[0]?.variants.thumb ?? null;
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
