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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CategoryService } from '@shared/services/category.service';
import { UploadService } from '@shared/services/upload.service';
import { Category, CategoryDto } from '@shared/interfaces/category.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
import { environment } from '@env/environment';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private readonly _categoryService: CategoryService = inject(CategoryService);
  private readonly _uploadService: UploadService = inject(UploadService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly apiUrl = environment.apiUrl;

  readonly _loading = signal(false);
  readonly _categories = signal<Category[]>([]);
  readonly _total = signal(0);
  readonly _totalPages = signal(0);
  readonly _page = signal(1);
  readonly _limit = signal(10);
  readonly _search = signal('');

  readonly _from = computed(() =>
    this._total() === 0 ? 0 : (this._page() - 1) * this._limit() + 1,
  );
  readonly _to = computed(() =>
    Math.min(this._page() * this._limit(), this._total()),
  );

  readonly _panelOpen = signal(false);
  readonly _saving = signal(false);
  readonly _uploading = signal(false);
  readonly _editingId = signal<string | null>(null);
  readonly _deletingId = signal<string | null>(null);
  readonly _panelImages = signal<ImageVariant[]>([]);

  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(50)]],
  });

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
        this._load();
      });
    this._load();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _load(): void {
    this._loading.set(true);
    this._categoryService
      .getPaginated({
        page: this._page(),
        limit: this._limit(),
        search: this._search() || undefined,
      })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          this._categories.set(res.items);
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

  onLimitChange(value: string): void {
    this._limit.set(Number(value));
    this._page.set(1);
    this._load();
  }

  prevPage(): void {
    if (this._page() <= 1) return;
    this._page.update((p) => p - 1);
    this._load();
  }

  nextPage(): void {
    if (this._page() >= this._totalPages()) return;
    this._page.update((p) => p + 1);
    this._load();
  }

  openCreate(): void {
    this._editingId.set(null);
    this._panelImages.set([]);
    this.form.reset();
    this._panelOpen.set(true);
  }

  openEdit(category: Category): void {
    this._editingId.set(category.id);
    this._panelImages.set([...(category.images ?? [])]);
    this.form.patchValue({ name: category.name, code: category.code });
    this._panelOpen.set(true);
  }

  closePanel(): void {
    this._panelOpen.set(false);
    this._editingId.set(null);
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const dto: CategoryDto = {
      ...this.form.getRawValue(),
      images: this._panelImages(),
    };

    const onSuccess = (): void => {
      this._saving.set(false);
      this.closePanel();
      this._page.set(1);
      this._load();
    };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._categoryService
        .update(editingId, dto)
        .pipe(takeUntil(this._destroy$))
        .subscribe({ next: onSuccess, error: onError });
    } else {
      this._categoryService
        .create(dto)
        .pipe(takeUntil(this._destroy$))
        .subscribe({ next: onSuccess, error: onError });
    }
  }

  confirmDelete(id: string): void {
    this._deletingId.set(id);
  }
  cancelDelete(): void {
    this._deletingId.set(null);
  }

  doDelete(id: string): void {
    this._categoryService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this._deletingId.set(null);
          if (this._categories().length === 1 && this._page() > 1)
            this._page.update((p) => p - 1);
          this._load();
        },
        error: () => this._deletingId.set(null),
      });
  }

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    this._uploading.set(true);
    this._uploadService
      .uploadImages('categories', files)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (variants) => {
          this._panelImages.update((curr) => [...curr, ...variants]);
          this._uploading.set(false);
        },
        error: () => this._uploading.set(false),
      });
  }

  removeImage(index: number): void {
    this._panelImages.update((imgs) => imgs.filter((_, i) => i !== index));
  }
}
