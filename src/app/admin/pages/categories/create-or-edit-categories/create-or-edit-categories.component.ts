import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputFieldComponent } from '@shared/components';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CategoryService } from '@shared/services/category.service';
import { UploadService } from '@shared/services/upload.service';
import { Category, CategoryDto } from '@shared/interfaces/category.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
import { environment } from '@env/environment';

@Component({
  selector: 'app-create-or-edit-categories',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent],
  templateUrl: './create-or-edit-categories.component.html',
})
export class CreateOrEditCategoriesComponent implements OnInit, OnDestroy {
  private readonly _categoryService: CategoryService = inject(CategoryService);
  private readonly _uploadService: UploadService = inject(UploadService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly apiUrl: string = environment.apiUrl;

  readonly _loading = signal(false);
  readonly _saving = signal(false);
  readonly _uploading = signal(false);
  readonly _editingId = signal<number | null>(null);
  readonly _images = signal<ImageVariant[]>([]);

  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(50)]],
  });

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    this._editingId.set(id);

    if (id) {
      this._loading.set(true);
      this._categoryService
        .getOne(id)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: (category: Category) => {
            this.form.patchValue({ name: category.name, code: category.code });
            this._images.set([...(category.images ?? [])]);
            this._loading.set(false);
          },
          error: () => this._loading.set(false),
        });
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  goBack(): void {
    this._router.navigate(['/admin/categories']);
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
          this._images.update((curr) => [...curr, ...variants]);
          this._uploading.set(false);
        },
        error: () => this._uploading.set(false),
      });
  }

  removeImage(index: number): void {
    this._images.update((imgs) => imgs.filter((_, i) => i !== index));
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const dto: CategoryDto = {
      ...this.form.getRawValue(),
      images: this._images(),
    };

    const onSuccess = (): void => {
      this._saving.set(false);
      this.goBack();
    };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._categoryService.update(editingId, dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    } else {
      this._categoryService.create(dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    }
  }
}
