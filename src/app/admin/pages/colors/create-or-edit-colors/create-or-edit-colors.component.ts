import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputFieldComponent } from '@shared/components';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ColorService } from '@shared/services/color.service';
import { Color, ColorDto, ColorSurface, COLOR_SURFACE_OPTIONS, COLOR_FAMILIES } from '@shared/interfaces/color.interface';
import { CacheRouteReuseStrategy } from '@shared/strategies/cache-route-reuse.strategy';

@Component({
  selector: 'app-create-or-edit-colors',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent],
  templateUrl: './create-or-edit-colors.component.html',
})
export class CreateOrEditColorsComponent implements OnInit, OnDestroy {
  private readonly _colorService: ColorService = inject(ColorService);
  private readonly _routeReuse: CacheRouteReuseStrategy = inject(CacheRouteReuseStrategy);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  readonly _loading   = signal(false);
  readonly _saving    = signal(false);
  readonly _editingId = signal<number | null>(null);
  readonly _surfaces  = signal<ColorSurface[]>([]);
  readonly SURFACE_OPTIONS = COLOR_SURFACE_OPTIONS;
  readonly FAMILIES        = COLOR_FAMILIES;

  readonly form = this._fb.nonNullable.group({
    name:        ['', [Validators.required, Validators.maxLength(100)]],
    hex:         ['#000000', [Validators.required, Validators.pattern(/^#([0-9A-Fa-f]{6})$/)]],
    colorFamily: [''],
    code:        [''],
    isActive:    [true],
  });

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    this._editingId.set(id);

    if (id) {
      this._loading.set(true);
      this._colorService
        .getOne(id)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: (color: Color) => {
            this._surfaces.set((color.surfaces ?? []) as ColorSurface[]);
            this.form.patchValue({
              name:        color.name,
              hex:         color.hex,
              colorFamily: color.colorFamily ?? '',
              code:        color.code ?? '',
              isActive:    color.isActive ?? true,
            });
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

  toggleSurface(value: ColorSurface): void {
    this._surfaces.update(s => s.includes(value) ? s.filter(v => v !== value) : [...s, value]);
    this.form.markAsDirty();
  }

  goBack(): void {
    this._router.navigate(['/admin/colors']);
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const raw = this.form.getRawValue();
    const dto: ColorDto = {
      name:        raw.name,
      hex:         raw.hex,
      colorFamily: raw.colorFamily || undefined,
      code:        raw.code || undefined,
      surfaces:    this._surfaces().length > 0 ? this._surfaces() : undefined,
      isActive:    raw.isActive,
    };

    const onSuccess = (): void => {
      this._saving.set(false);
      this.form.markAsPristine();
      this._routeReuse.invalidate('colors');
      this.goBack();
    };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._colorService.update(editingId, dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    } else {
      this._colorService.create(dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    }
  }
}
