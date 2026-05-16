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
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ProductService } from '@shared/services/product.service';
import { BrandService } from '@shared/services/brand.service';
import { OrganizationalService } from '@shared/services/organizational.service';
import { Product } from '@shared/interfaces/product.interface';
import { Category } from '@shared/interfaces/category.interface';
import { Brand } from '@shared/interfaces/brand.interface';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly _productService: ProductService = inject(ProductService);
  private readonly _brandService: BrandService = inject(BrandService);
  private readonly _organizationalService: OrganizationalService = inject(OrganizationalService);
  private readonly _confirmDialog: ConfirmDialogService = inject(ConfirmDialogService);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly _loading = signal(false);
  readonly _products = signal<Product[]>([]);
  readonly _total = signal(0);
  readonly _totalPages = signal(0);
  readonly _page = signal(1);
  readonly _limit = signal(10);
  readonly _search = signal('');
  readonly _categoryFilter = signal<number | undefined>(undefined);
  readonly _brandFilter = signal<number | undefined>(undefined);

  readonly _from = computed(() =>
    this._total() === 0 ? 0 : (this._page() - 1) * this._limit() + 1,
  );
  readonly _to = computed(() =>
    Math.min(this._page() * this._limit(), this._total()),
  );

  readonly _categories = signal<Category[]>([]);
  readonly _brands = signal<Brand[]>([]);

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

    forkJoin({
      bootstrap: this._organizationalService.bootstrap(),
      brands: this._brandService.getAll(),
    })
      .pipe(takeUntil(this._destroy$))
      .subscribe(({ bootstrap, brands }) => {
        this._categories.set(bootstrap.categories);
        this._brands.set(brands);
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
        limit: this._limit(),
        search: this._search() || undefined,
        categoryId: this._categoryFilter(),
        brandId: this._brandFilter(),
      })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          this._products.set(res.items);
          this._total.set(res.total);
          this._totalPages.set(res.totalPages);
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

  onLimitChange(value: string): void {
    this._limit.set(Number(value));
    this._page.set(1);
    this._loadProducts();
  }

  prevPage(): void {
    if (this._page() <= 1) return;
    this._page.update((p) => p - 1);
    this._loadProducts();
  }

  nextPage(): void {
    if (this._page() >= this._totalPages()) return;
    this._page.update((p) => p + 1);
    this._loadProducts();
  }

  openCreate(): void {
    this._router.navigate(['/admin/products/create-or-edit-products']);
  }

  openEdit(product: Product): void {
    this._router.navigate(['/admin/products/create-or-edit-products', product.id]);
  }

  confirmDelete(id: number, name: string): void {
    this._confirmDialog.confirmDelete(name).subscribe((confirmed) => {
      if (confirmed) this.doDelete(id);
    });
  }

  private doDelete(id: number): void {
    this._productService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          if (this._products().length === 1 && this._page() > 1) {
            this._page.update((p) => p - 1);
          }
          this._loadProducts();
        },
      });
  }
}
