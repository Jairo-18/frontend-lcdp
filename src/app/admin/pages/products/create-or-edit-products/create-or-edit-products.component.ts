import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { InputFieldComponent } from '@shared/components';
import { TextareaFieldComponent } from '@shared/components';
import { SelectFieldComponent } from '@shared/components';
import { SelectOption } from '@shared/interfaces/forms.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductService } from '@shared/services/product.service';
import { OrganizationalService } from '@shared/services/organizational.service';
import { UploadService } from '@shared/services/upload.service';
import { ImagePreviewService } from '@shared/services/image-preview.service';
import {
  UnitOfMeasure,
  CreateProductDto,
} from '@shared/interfaces/product.interface';
import { Category } from '@shared/interfaces/category.interface';
import { Brand } from '@shared/interfaces/brand.interface';
import { TaxType } from '@shared/interfaces/tax-type.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
@Component({
  selector: 'app-create-or-edit-products',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent, TextareaFieldComponent, SelectFieldComponent],
  templateUrl: './create-or-edit-products.component.html',
})
export class CreateOrEditProductsComponent implements OnInit, OnDestroy {
  private readonly _productService: ProductService = inject(ProductService);
  private readonly _organizationalService: OrganizationalService = inject(OrganizationalService);
  private readonly _uploadService: UploadService = inject(UploadService);
  private readonly _sanitizer: DomSanitizer = inject(DomSanitizer);
  readonly _previewSvc: ImagePreviewService = inject(ImagePreviewService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly _loading = signal(false);
  readonly _saving = signal(false);
  readonly _editingId = signal<number | null>(null);

  readonly _categories = signal<Category[]>([]);
  readonly _brands = signal<Brand[]>([]);
  readonly _units = signal<UnitOfMeasure[]>([]);
  readonly _taxTypes = signal<TaxType[]>([]);

  readonly _presImages = signal<ImageVariant[][]>([]);
  readonly _uploadingForIndex = signal<number | null>(null);

  // Preview state
  readonly _previewPresIndex = signal(0);
  readonly _previewImageIndex = signal(0);

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

  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    code: [''],
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

  // --- Preview helpers ---

  get previewBrandName(): string {
    const id = this.form.get('brandId')?.value;
    if (!id) return '';
    return this._brands().find((b) => String(b.id) === String(id))?.name ?? '';
  }

  previewUnitName(pi: number): string {
    const presForm = this.presentationsArray.at(pi) as FormGroup | null;
    const unitId = presForm?.get('unitOfMeasureId')?.value;
    if (!unitId) return '';
    return this._units().find((u) => String(u.id) === String(unitId))?.name ?? '';
  }

  thumbnailPlaceholders(presIndex: number): number[] {
    const count = Math.max(0, 4 - this.presImages(presIndex).length);
    return Array.from({ length: count }, (_, i) => i);
  }

  formatPrice(value: number | null | undefined): string {
    if (value == null) return '—';
    return '$' + new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  get previewVideoEmbedUrl(): SafeResourceUrl | null {
    const url = this.form.get('videoUrl')?.value;
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      return this._sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${ytMatch[1]}`,
      );
    }
    return null;
  }

  selectPreviewPres(index: number): void {
    this._previewPresIndex.set(index);
    this._previewImageIndex.set(0);
  }

  selectPreviewImage(index: number): void {
    this._previewImageIndex.set(index);
  }

  // --- End preview helpers ---

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    this._editingId.set(id);
    this._loading.set(true);

    this._organizationalService
      .bootstrap()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (bootstrap) => {
          this._categories.set(bootstrap.categories);
          this._units.set(bootstrap.units);
          this._brands.set(bootstrap.brands);
          this._taxTypes.set(bootstrap.taxTypes);

          if (id) {
            this._productService
              .getOne(id)
              .pipe(takeUntil(this._destroy$))
              .subscribe({
                next: (p) => {
                  this.presentationsArray.clear();
                  this.form.patchValue({
                    name: p.name,
                    code: p.code ?? '',
                    description: p.description ?? '',
                    categoryId: String(p.categoryId),
                    brandId: String(p.brandId),
                    priceSale: p.priceSale ?? null,
                    taxTypeId: p.taxTypeId ? String(p.taxTypeId) : '',
                    isActive: p.isActive,
                    videoUrl: p.videoUrl ?? '',
                  });
                  (p.presentations ?? []).forEach((pres) =>
                    this._addPresentationRow(
                      String(pres.unitOfMeasureId),
                      pres.sku ?? '',
                      pres.priceSale ?? null,
                    ),
                  );
                  this._presImages.set(
                    (p.presentations ?? []).map((pres) =>
                      (pres.images ?? []).map((img) => img.variants),
                    ),
                  );
                  this._loading.set(false);
                },
                error: () => this._loading.set(false),
              });
          } else {
            this._loading.set(false);
          }
        },
        error: () => this._loading.set(false),
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
    this._addPresentationRow('', '', null);
    this._presImages.update((imgs) => [...imgs, []]);
  }

  removePresentation(index: number): void {
    this.presentationsArray.removeAt(index);
    this._presImages.update((imgs) => imgs.filter((_, i) => i !== index));
    const newLen = this.presentationsArray.length;
    if (newLen === 0) {
      this._previewPresIndex.set(0);
    } else if (this._previewPresIndex() >= newLen) {
      this._previewPresIndex.set(newLen - 1);
    }
    this._previewImageIndex.set(0);
  }

  triggerImageUpload(index: number): void {
    this._uploadingForIndex.set(index);
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const index = this._uploadingForIndex();
    if (index === null) return;

    const files = Array.from(input.files);
    this._uploadService
      .uploadImages('products/images', files)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (variants) => {
          this._presImages.update((imgs) => {
            const updated = [...imgs];
            updated[index] = [...(updated[index] ?? []), ...variants];
            return updated;
          });
          this._uploadingForIndex.set(null);
        },
        error: () => this._uploadingForIndex.set(null),
      });
  }

  presImages(index: number): ImageVariant[] {
    return this._presImages()[index] ?? [];
  }

  removeImage(presIndex: number, imgIndex: number): void {
    this._presImages.update((imgs) => {
      const updated = [...imgs];
      updated[presIndex] = updated[presIndex].filter((_, i) => i !== imgIndex);
      return updated;
    });
    if (this._previewImageIndex() >= (this._presImages()[presIndex]?.length ?? 0)) {
      this._previewImageIndex.set(0);
    }
  }

  openPresPreview(presIndex: number, imageIndex: number): void {
    const urls = this.presImages(presIndex).map((img) => img.md);
    if (urls.length) this._previewSvc.open(urls, imageIndex);
  }

  private _addPresentationRow(unitOfMeasureId: string, sku: string, priceSale: number | null): void {
    this.presentationsArray.push(
      this._fb.nonNullable.group({
        unitOfMeasureId: [unitOfMeasureId, Validators.required],
        sku: [sku],
        priceSale: [priceSale as number | null],
      }),
    );
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const raw = this.form.getRawValue();
    const presImages = this._presImages();
    type PresentationRaw = { unitOfMeasureId: string; sku: string; priceSale: number | null };
    const dto: CreateProductDto = {
      name: raw.name,
      code: raw.code || undefined,
      description: raw.description || undefined,
      categoryId: Number(raw.categoryId),
      brandId: Number(raw.brandId),
      priceSale: raw.priceSale ?? undefined,
      taxTypeId: raw.taxTypeId ? Number(raw.taxTypeId) : undefined,
      isActive: raw.isActive,
      videoUrl: raw.videoUrl || undefined,
      presentations: (raw.presentations as PresentationRaw[]).map((p, i) => ({
        unitOfMeasureId: Number(p.unitOfMeasureId),
        sku: p.sku || undefined,
        priceSale: p.priceSale ?? undefined,
        images: presImages[i] ?? [],
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
