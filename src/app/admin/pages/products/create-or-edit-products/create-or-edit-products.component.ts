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
import { ActivatedRoute, Router } from '@angular/router';
import { InputFieldComponent } from '@shared/components';
import { TextareaFieldComponent } from '@shared/components';
import { SelectFieldComponent } from '@shared/components';
import { SelectOption } from '@shared/interfaces/forms.interface';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductService } from '@shared/services/product.service';
import { BrandService } from '@shared/services/brand.service';
import { OrganizationalService } from '@shared/services/organizational.service';
import {
  UnitOfMeasure,
  CreateProductDto,
} from '@shared/interfaces/product.interface';
import { Category } from '@shared/interfaces/category.interface';
import { Brand } from '@shared/interfaces/brand.interface';

@Component({
  selector: 'app-create-or-edit-products',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent, TextareaFieldComponent, SelectFieldComponent],
  templateUrl: './create-or-edit-products.component.html',
})
export class CreateOrEditProductsComponent implements OnInit, OnDestroy {
  private readonly _productService: ProductService = inject(ProductService);
  private readonly _brandService: BrandService = inject(BrandService);
  private readonly _organizationalService: OrganizationalService = inject(OrganizationalService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  readonly _loading = signal(false);
  readonly _saving = signal(false);
  readonly _editingId = signal<string | null>(null);

  readonly _categories = signal<Category[]>([]);
  readonly _brands = signal<Brand[]>([]);
  readonly _units = signal<UnitOfMeasure[]>([]);

  readonly categoryOptions = computed<SelectOption[]>(() =>
    this._categories().map((c) => ({ value: c.id, label: c.name })),
  );
  readonly brandOptions = computed<SelectOption[]>(() =>
    this._brands().map((b) => ({ value: b.id, label: b.name })),
  );
  readonly unitOptions = computed<SelectOption[]>(() =>
    this._units().map((u) => ({ value: u.id, label: u.name })),
  );

  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    categoryId: ['', Validators.required],
    brandId: ['', Validators.required],
    videoUrl: [''],
    presentations: this._fb.array([]),
  });

  get presentationsArray(): FormArray<FormGroup> {
    return this.form.get('presentations') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    this._editingId.set(id);
    this._loading.set(true);

    forkJoin({
      bootstrap: this._organizationalService.bootstrap(),
      brands: this._brandService.getAll(),
    })
      .pipe(takeUntil(this._destroy$))
      .subscribe(({ bootstrap, brands }) => {
        this._categories.set(bootstrap.categories);
        this._units.set(bootstrap.units);
        this._brands.set(brands);

        if (id) {
          this._productService
            .getOne(id)
            .pipe(takeUntil(this._destroy$))
            .subscribe((p) => {
              this.presentationsArray.clear();
              this.form.patchValue({
                name: p.name,
                description: p.description ?? '',
                categoryId: p.categoryId,
                brandId: p.brandId,
                videoUrl: p.videoUrl ?? '',
              });
              (p.presentations ?? []).forEach((pres) =>
                this._addPresentationRow(pres.unitOfMeasureId, pres.sku ?? ''),
              );
              this._loading.set(false);
            });
        } else {
          this._loading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  goBack(): void {
    this._router.navigate(['/admin/products']);
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

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const raw = this.form.getRawValue();
    type PresentationRaw = { unitOfMeasureId: string; sku: string };
    const dto: CreateProductDto = {
      name: raw.name,
      description: raw.description || undefined,
      categoryId: raw.categoryId,
      brandId: raw.brandId,
      videoUrl: raw.videoUrl || undefined,
      presentations: (raw.presentations as PresentationRaw[]).map((p) => ({
        unitOfMeasureId: p.unitOfMeasureId,
        sku: p.sku || undefined,
      })),
    };

    const onSuccess = (): void => {
      this._saving.set(false);
      this.goBack();
    };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._productService.update(editingId, dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    } else {
      this._productService.create(dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    }
  }
}
