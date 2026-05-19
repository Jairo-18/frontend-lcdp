import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputFieldComponent, ImageUploaderComponent } from '@shared/components';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BrandService } from '@shared/services/brand.service';
import { Brand, BrandDto } from '@shared/interfaces/brand.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';

@Component({
  selector: 'app-create-or-edit-brands',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent, ImageUploaderComponent],
  templateUrl: './create-or-edit-brands.component.html',
})
export class CreateOrEditBrandsComponent implements OnInit, OnDestroy {
  private readonly _brandService: BrandService = inject(BrandService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  readonly _loading   = signal(false);
  readonly _saving    = signal(false);
  readonly _editingId = signal<number | null>(null);
  readonly _images    = signal<ImageVariant[]>([]);

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
      this._brandService
        .getOne(id)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: (brand: Brand) => {
            this.form.patchValue({ name: brand.name, code: brand.code });
            this._images.set([...(brand.images ?? [])]);
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
    this._router.navigate(['/admin/brands']);
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const dto: BrandDto = { ...this.form.getRawValue(), images: this._images() };
    const onSuccess = (): void => { this._saving.set(false); this.goBack(); };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._brandService.update(editingId, dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    } else {
      this._brandService.create(dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    }
  }
}
