import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { InputFieldComponent } from '@shared/components';
import { TextareaFieldComponent } from '@shared/components';
import { SelectFieldComponent } from '@shared/components';
import { SelectOption } from '@shared/interfaces/forms.interface';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ProductService } from '@shared/services/product.service';
import { BrandService } from '@shared/services/brand.service';
import { OrganizationalService } from '@shared/services/organizational.service';
import { TaxTypeService } from '@shared/services/tax-type.service';
import {
  Product,
  UnitOfMeasure,
  CreateProductDto,
} from '@shared/interfaces/product.interface';
import { Category } from '@shared/interfaces/category.interface';
import { Brand } from '@shared/interfaces/brand.interface';
import { TaxType } from '@shared/interfaces/tax-type.interface';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, InputFieldComponent, TextareaFieldComponent, SelectFieldComponent],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly _productService: ProductService = inject(ProductService);
  private readonly _brandService: BrandService = inject(BrandService);
  private readonly _organizationalService: OrganizationalService = inject(OrganizationalService);
  private readonly _taxTypeService: TaxTypeService = inject(TaxTypeService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _confirmDialog: ConfirmDialogService = inject(ConfirmDialogService);
  private readonly _destroy$ = new Subject<void>();
  private readonly _search$ = new Subject<string>();

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
  readonly _units = signal<UnitOfMeasure[]>([]);
  readonly _taxTypes = signal<TaxType[]>([]);

  readonly categoryOptions = computed<SelectOption[]>(() =>
    this._categories().map((c) => ({ value: c.id, label: c.name })),
  );
  readonly brandOptions = computed<SelectOption[]>(() =>
    this._brands().map((b) => ({ value: b.id, label: b.name })),
  );
  readonly unitOptions = computed<SelectOption[]>(() =>
    this._units().map((u) => ({ value: u.id, label: u.name })),
  );
  readonly taxTypeOptions = computed<SelectOption[]>(() =>
    this._taxTypes().map((t) => ({ value: t.id, label: t.name })),
  );

  readonly _panelOpen = signal(false);
  readonly _saving = signal(false);
  readonly _editingId = signal<number | null>(null);
  readonly _loadingProduct = signal(false);

  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    categoryId: ['', Validators.required],
    brandId: ['', Validators.required],
    priceSale: [null as number | null],
    taxTypeId: [''],
    isActive: [true],
    videoUrl: [''],
    presentations: this._fb.array([]),
  });

  get presentationsArray(): FormArray<FormGroup> {
    return this.form.get('presentations') as FormArray<FormGroup>;
  }

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
      taxTypes: this._taxTypeService.getAll(),
    })
      .pipe(takeUntil(this._destroy$))
      .subscribe(({ bootstrap, brands, taxTypes }) => {
        this._categories.set(bootstrap.categories);
        this._units.set(bootstrap.units);
        this._brands.set(brands);
        this._taxTypes.set(taxTypes);
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
    this._editingId.set(null);
    this.form.reset();
    this.presentationsArray.clear();
    this._panelOpen.set(true);
  }

  openEdit(product: Product): void {
    this._editingId.set(product.id);
    this._loadingProduct.set(true);
    this._panelOpen.set(true);

    this._productService
      .getOne(product.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe((p) => {
        this.presentationsArray.clear();
        this.form.patchValue({
          name: p.name,
          description: p.description ?? '',
          categoryId: String(p.categoryId),
          brandId: String(p.brandId),
          priceSale: p.priceSale ?? null,
          taxTypeId: p.taxTypeId ? String(p.taxTypeId) : '',
          isActive: p.isActive,
          videoUrl: p.videoUrl ?? '',
        });
        (p.presentations ?? []).forEach((pres) =>
          this._addPresentationRow(String(pres.unitOfMeasureId), pres.sku ?? ''),
        );
        this._loadingProduct.set(false);
      });
  }

  closePanel(): void {
    this._panelOpen.set(false);
    this._editingId.set(null);
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const raw = this.form.getRawValue();
    type PresentationRaw = { unitOfMeasureId: string; sku: string };
    const dto: CreateProductDto = {
      name: raw.name,
      description: raw.description || undefined,
      categoryId: Number(raw.categoryId),
      brandId: Number(raw.brandId),
      priceSale: raw.priceSale ?? undefined,
      taxTypeId: raw.taxTypeId ? Number(raw.taxTypeId) : undefined,
      isActive: raw.isActive,
      videoUrl: raw.videoUrl || undefined,
      presentations: (raw.presentations as PresentationRaw[]).map((p) => ({
        unitOfMeasureId: Number(p.unitOfMeasureId),
        sku: p.sku || undefined,
      })),
    };

    const onSuccess = (): void => {
      this._saving.set(false);
      this.closePanel();
      this._page.set(1);
      this._loadProducts();
    };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._productService
        .update(editingId, dto)
        .pipe(takeUntil(this._destroy$))
        .subscribe({ next: onSuccess, error: onError });
    } else {
      this._productService
        .create(dto)
        .pipe(takeUntil(this._destroy$))
        .subscribe({ next: onSuccess, error: onError });
    }
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

  addPresentation(): void {
    this._addPresentationRow('', '');
  }

  removePresentation(index: number): void {
    this.presentationsArray.removeAt(index);
  }

  private _addPresentationRow(unitOfMeasureId: string, sku: string): void {
    this.presentationsArray.push(
      this._fb.nonNullable.group({
        unitOfMeasureId: [unitOfMeasureId, Validators.required],
        sku: [sku],
      }),
    );
  }
}
