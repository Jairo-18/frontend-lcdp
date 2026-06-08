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
import { ColorService } from '@shared/services/color.service';
import { UploadService } from '@shared/services/upload.service';
import { ImagePreviewService } from '@shared/services/image-preview.service';
import { ImageEditorService } from '@shared/services/image-editor.service';
import { CacheRouteReuseStrategy } from '@shared/strategies/cache-route-reuse.strategy';
import {
  UnitOfMeasure,
  CreateProductDto,
  PresentationFormRaw,
} from '@shared/interfaces/product.interface';
import { Category } from '@shared/interfaces/category.interface';
import { Brand } from '@shared/interfaces/brand.interface';
import { Color } from '@shared/interfaces/color.interface';
import { TaxType } from '@shared/interfaces/tax-type.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
@Component({
  selector: 'app-create-or-edit-products',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputFieldComponent,
    TextareaFieldComponent,
    SelectFieldComponent,
  ],
  templateUrl: './create-or-edit-products.component.html',
})
export class CreateOrEditProductsComponent implements OnInit, OnDestroy {
  private readonly _productService: ProductService = inject(ProductService);
  private readonly _organizationalService: OrganizationalService = inject(OrganizationalService);
  private readonly _colorService: ColorService = inject(ColorService);
  private readonly _uploadService: UploadService = inject(UploadService);
  private readonly _editorSvc: ImageEditorService = inject(ImageEditorService);
  private readonly _routeReuse: CacheRouteReuseStrategy = inject(CacheRouteReuseStrategy);
  private readonly _sanitizer: DomSanitizer = inject(DomSanitizer);
  private readonly _previewSvc: ImagePreviewService = inject(ImagePreviewService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('techPdfInput') techPdfInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('safetyPdfInput') safetyPdfInputRef!: ElementRef<HTMLInputElement>;

  readonly _loading = signal(true);
  readonly _saving = signal(false);
  readonly _editingId = signal<number | null>(null);

  private _cachedVideoUrl: string | null = null;
  private _cachedEmbedUrl: SafeResourceUrl | null = null;

  readonly _categories = signal<Category[]>([]);
  readonly _brands = signal<Brand[]>([]);
  readonly _units = signal<UnitOfMeasure[]>([]);
  readonly _taxTypes = signal<TaxType[]>([]);
  readonly _colors = signal<Color[]>([]);
  readonly _categoryIds = signal<number[]>([]);
  readonly _colorIds = signal<number[]>([]);

  readonly _selectedColors = computed(() =>
    this._colorIds().map(id => this._colors().find(c => c.id === id)).filter(Boolean) as Color[],
  );

  readonly _selectedCategoryNames = computed(() =>
    this._categoryIds().map(id => this._categories().find(c => c.id === id)?.name).filter(Boolean) as string[],
  );

  readonly _presImages = signal<ImageVariant[][]>([]);
  readonly _uploadingForIndex = signal<number | null>(null);
  readonly _uploadingTechPdf = signal(false);
  readonly _uploadingSafetyPdf = signal(false);
  readonly _expandedPreviewPanels = signal<Set<string>>(new Set());

  readonly _previewPresIndex = signal(0);
  readonly _previewImageIndex = signal(0);

  readonly percentageOptions: SelectOption[] = Array.from(
    { length: 100 },
    (_, i) => ({ value: i + 1, label: `${i + 1}%` }),
  );

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
    brandId: ['', Validators.required],
    priceSale: [null as number | null],
    taxTypeId: [''],
    isActive: [true],
    isPromotion: [false],
    videoUrl: [''],
    technicalSheet: [null as string | null],
    safetySheet: [null as string | null],
    modeOfUse: [''],
    performance: [''],
    benefits: [''],
    presentations: this._fb.array([]),
    markupPercentage: [null as number | null],
    discountPercentage: [null as number | null],
  });

  get presentationsArray(): FormArray<FormGroup> {
    return this.form.get('presentations') as FormArray<FormGroup>;
  }

  toggleCategory(id: number): void {
    this._categoryIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id],
    );
    this.form.markAsDirty();
  }

  toggleColor(id: number): void {
    this._colorIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id],
    );
    this.form.markAsDirty();
  }

  colorCheckmark(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1a1c2c' : '#ffffff';
  }

  get selectedBrandId(): number | null {
    const v = this.form.get('brandId')?.value;
    return v ? Number(v) : null;
  }

  selectBrand(id: number): void {
    const current = this.selectedBrandId;
    this.form.get('brandId')!.setValue(current === id ? '' : String(id));
    this.form.markAsDirty();
  }

  get previewBrandName(): string {
    const id = this.form.get('brandId')?.value;
    if (!id) return '';
    return this._brands().find((b) => String(b.id) === String(id))?.name ?? '';
  }

  previewUnitName(pi: number): string {
    const presForm = this.presentationsArray.at(pi) as FormGroup | null;
    const unitId = presForm?.get('unitOfMeasureId')?.value;
    if (!unitId) return '';
    return (
      this._units().find((u) => String(u.id) === String(unitId))?.name ?? ''
    );
  }

  thumbnailPlaceholders(presIndex: number): number[] {
    const count = Math.max(0, 4 - this.presImages(presIndex).length);
    return Array.from({ length: count }, (_, i) => i);
  }

  formatPrice(value: number | null | undefined): string {
    if (value == null) return '—';
    return '$' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)) + ' COP';
  }

  formatPriceFull(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)) + ' COP';
  }

  webPriceForPresentation(base: number | null | undefined): string {
    if (base == null) return '—';
    const markup = Number(this.form.get('markupPercentage')?.value) || 0;
    return this.formatPrice(Number(base) * (1 + markup / 100));
  }

  private _previewWebPriceNum(): number | null {
    const base =
      this.presentationsArray.length > 0
        ? this.presentationsArray.at(this._previewPresIndex()).get('priceSale')?.value
        : this.form.get('priceSale')?.value;
    if (base == null) return null;
    const markup = Number(this.form.get('markupPercentage')?.value) || 0;
    return Number(base) * (1 + markup / 100);
  }

  previewWebPrice(): string {
    const n = this._previewWebPriceNum();
    return n == null ? '—' : this.formatPrice(n);
  }

  previewWebPriceFull(): string {
    const n = this._previewWebPriceNum();
    return n == null ? '' : this.formatPriceFull(n);
  }

  get previewVideoEmbedUrl(): SafeResourceUrl | null {
    const url = this.form.get('videoUrl')?.value || null;
    if (url === this._cachedVideoUrl) return this._cachedEmbedUrl;
    this._cachedVideoUrl = url;
    if (!url) return (this._cachedEmbedUrl = null);
    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    );
    this._cachedEmbedUrl = ytMatch
      ? this._sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
        )
      : null;
    return this._cachedEmbedUrl;
  }

  selectPreviewPres(index: number): void {
    this._previewPresIndex.set(index);
    this._previewImageIndex.set(0);
  }

  selectPreviewImage(index: number): void {
    this._previewImageIndex.set(index);
  }

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    this._editingId.set(id);
    this._loading.set(true);

    this._colorService.getAll().pipe(takeUntil(this._destroy$)).subscribe({
      next: (colors) => this._colors.set(colors),
    });

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
                  this._categoryIds.set((p.categories ?? []).map(c => c.id));
                  this._colorIds.set((p.colors ?? []).map(c => c.id));
                  this.form.patchValue({
                    name: p.name,
                    code: p.code ?? '',
                    description: p.description ?? '',
                    brandId: String(p.brandId),
                    priceSale: p.priceSale ?? null,
                    taxTypeId: p.taxTypeId ? String(p.taxTypeId) : '',
                    isActive: p.isActive,
                    isPromotion: p.isPromotion ?? false,
                    videoUrl: p.videoUrl ?? '',
                    technicalSheet: p.technicalSheet ?? null,
                    safetySheet: p.safetySheet ?? null,
                    modeOfUse: p.modeOfUse ?? '',
                    performance: p.performance ?? '',
                    benefits: p.benefits ?? '',
                    markupPercentage: p.markupPercentage ?? null,
                    discountPercentage: p.discountPercentage ?? null,
                  });
                  (p.presentations ?? []).forEach((pres) =>
                    this._addPresentationRow(
                      String(pres.unitOfMeasureId),
                      pres.sku ?? '',
                      pres.priceSale ?? null,
                      pres.rendimiento ?? null,
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
            const defaultTax = bootstrap.taxTypes.find(t =>
              t.name.toLowerCase().includes('iva') && t.name.includes('19'),
            );
            if (defaultTax) this.form.get('taxTypeId')!.setValue(String(defaultTax.id));

            this._productService
              .nextCode()
              .pipe(takeUntil(this._destroy$))
              .subscribe({
                next: (code) => {
                  this.form.get('code')!.setValue(code);
                  this._loading.set(false);
                },
                error: () => this._loading.set(false),
              });
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
    this.form.markAsDirty();
    this._presImages.update((imgs) => imgs.filter((_, i) => i !== index));
    const newLen = this.presentationsArray.length;
    if (newLen === 0) {
      this._previewPresIndex.set(0);
    } else if (this._previewPresIndex() >= newLen) {
      this._previewPresIndex.set(newLen - 1);
    }
    this._previewImageIndex.set(0);
  }

  movePresentationUp(index: number): void {
    if (index <= 0) return;
    const arr = this.presentationsArray;
    const ctrl = arr.at(index);
    arr.removeAt(index);
    arr.insert(index - 1, ctrl);
    this._presImages.update(imgs => {
      const updated = [...imgs];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated;
    });
    this._previewPresIndex.set(index - 1);
    this._previewImageIndex.set(0);
    this.form.markAsDirty();
  }

  movePresentationDown(index: number): void {
    const arr = this.presentationsArray;
    if (index >= arr.length - 1) return;
    const ctrl = arr.at(index);
    arr.removeAt(index);
    arr.insert(index + 1, ctrl);
    this._presImages.update(imgs => {
      const updated = [...imgs];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
    this._previewPresIndex.set(index + 1);
    this._previewImageIndex.set(0);
    this.form.markAsDirty();
  }

  triggerImageUpload(index: number): void {
    this._uploadingForIndex.set(index);
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const index = this._uploadingForIndex();
    if (index === null) return;

    const rawFiles = Array.from(input.files);
    const editedFiles = await this._editorSvc.edit(rawFiles);
    if (!editedFiles.length) {
      this._uploadingForIndex.set(null);
      return;
    }

    this._uploadService
      .uploadImages('products/images', editedFiles)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (variants) => {
          this._presImages.update((imgs) => {
            const updated = [...imgs];
            updated[index] = [...(updated[index] ?? []), ...variants];
            return updated;
          });
          this.form.markAsDirty();
          this._uploadingForIndex.set(null);
        },
        error: () => this._uploadingForIndex.set(null),
      });
  }

  presImages(index: number): ImageVariant[] {
    return this._presImages()[index] ?? [];
  }

  moveImageLeft(presIndex: number, imgIndex: number): void {
    if (imgIndex <= 0) return;
    this._presImages.update(imgs => {
      const updated = [...imgs];
      const presImgs = [...updated[presIndex]];
      [presImgs[imgIndex - 1], presImgs[imgIndex]] = [presImgs[imgIndex], presImgs[imgIndex - 1]];
      updated[presIndex] = presImgs;
      return updated;
    });
    this.form.markAsDirty();
  }

  moveImageRight(presIndex: number, imgIndex: number): void {
    const total = this._presImages()[presIndex]?.length ?? 0;
    if (imgIndex >= total - 1) return;
    this._presImages.update(imgs => {
      const updated = [...imgs];
      const presImgs = [...updated[presIndex]];
      [presImgs[imgIndex], presImgs[imgIndex + 1]] = [presImgs[imgIndex + 1], presImgs[imgIndex]];
      updated[presIndex] = presImgs;
      return updated;
    });
    this.form.markAsDirty();
  }

  removeImage(presIndex: number, imgIndex: number): void {
    this.form.markAsDirty();
    this._presImages.update((imgs) => {
      const updated = [...imgs];
      updated[presIndex] = updated[presIndex].filter((_, i) => i !== imgIndex);
      return updated;
    });
    if (
      this._previewImageIndex() >= (this._presImages()[presIndex]?.length ?? 0)
    ) {
      this._previewImageIndex.set(0);
    }
  }

  openPresPreview(presIndex: number, imageIndex: number): void {
    const urls = this.presImages(presIndex).map((img) => img.md);
    if (urls.length) this._previewSvc.open(urls, imageIndex);
  }

  private _addPresentationRow(
    unitOfMeasureId: string,
    sku: string,
    priceSale: number | null,
    rendimiento: number | null = null,
  ): void {
    this.presentationsArray.push(
      this._fb.nonNullable.group({
        unitOfMeasureId: [unitOfMeasureId, Validators.required],
        sku: [sku],
        priceSale: [priceSale as number | null],
        rendimiento: [rendimiento as number | null],
      }),
    );
  }

  togglePreviewPanel(key: string): void {
    this._expandedPreviewPanels.update(s => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  isPreviewPanelOpen(key: string): boolean {
    return this._expandedPreviewPanels().has(key);
  }

  safePdfUrlPreview(url: string | null | undefined): SafeResourceUrl | null {
    if (!url) return null;
    return this._sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  triggerTechPdfUpload(): void {
    this.techPdfInputRef.nativeElement.value = '';
    this.techPdfInputRef.nativeElement.click();
  }

  triggerSafetyPdfUpload(): void {
    this.safetyPdfInputRef.nativeElement.value = '';
    this.safetyPdfInputRef.nativeElement.click();
  }

  onTechPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this._uploadingTechPdf.set(true);
    this._uploadService.uploadDocument('products/documents', file)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (url) => {
          this.form.get('technicalSheet')!.setValue(url);
          this.form.markAsDirty();
          this._uploadingTechPdf.set(false);
        },
        error: () => this._uploadingTechPdf.set(false),
      });
  }

  onSafetyPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this._uploadingSafetyPdf.set(true);
    this._uploadService.uploadDocument('products/documents', file)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (url) => {
          this.form.get('safetySheet')!.setValue(url);
          this.form.markAsDirty();
          this._uploadingSafetyPdf.set(false);
        },
        error: () => this._uploadingSafetyPdf.set(false),
      });
  }

  removeTechPdf(): void {
    this.form.get('technicalSheet')!.setValue(null);
    this.form.markAsDirty();
  }

  removeSafetyPdf(): void {
    this.form.get('safetySheet')!.setValue(null);
    this.form.markAsDirty();
  }

  save(): void {
    if (this.form.invalid || this._saving() || this._categoryIds().length === 0) return;
    this._saving.set(true);

    const raw = this.form.getRawValue();
    const presImages: ImageVariant[][] = this._presImages();
    const dto: CreateProductDto = {
      name: raw.name,
      code: raw.code || undefined,
      description: raw.description || undefined,
      categoryIds: this._categoryIds(),
      colorIds: this._colorIds(),
      brandId: Number(raw.brandId),
      priceSale: raw.priceSale ?? undefined,
      taxTypeId: raw.taxTypeId ? Number(raw.taxTypeId) : undefined,
      isActive: raw.isActive,
      isPromotion: raw.isPromotion,
      videoUrl: raw.videoUrl || undefined,
      technicalSheet: raw.technicalSheet ?? null,
      safetySheet: raw.safetySheet ?? null,
      modeOfUse: raw.modeOfUse || undefined,
      performance: raw.performance || undefined,
      benefits: raw.benefits || undefined,
      presentations: (raw.presentations as PresentationFormRaw[]).map(
        (p, i) => ({
          unitOfMeasureId: Number(p.unitOfMeasureId),
          sku: p.sku || undefined,
          priceSale: p.priceSale ?? undefined,
          rendimiento: p.rendimiento ?? undefined,
          images: presImages[i] ?? [],
        }),
      ),
      markupPercentage: raw.markupPercentage ?? undefined,
      discountPercentage: raw.discountPercentage ?? undefined,
    };

    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._productService
        .update(editingId, dto)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: () => {
            this._saving.set(false);
            this.form.markAsPristine();
            this._routeReuse.invalidate('products');
          },
          error: onError,
        });
    } else {
      this._productService
        .create(dto)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: ({ rowId }) => {
            this._saving.set(false);
            this._routeReuse.invalidate('products');
            this._router.navigate(['/admin/products']);
          },
          error: onError,
        });
    }
  }
}
