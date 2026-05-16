import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputFieldComponent } from '@shared/components';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UnitOfMeasureService } from '@shared/services/unit-of-measure.service';
import {
  UnitOfMeasure,
  UnitOfMeasureDto,
} from '@shared/interfaces/product.interface';

@Component({
  selector: 'app-create-or-edit-units',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent],
  templateUrl: './create-or-edit-units.component.html',
})
export class CreateOrEditUnitsComponent implements OnInit, OnDestroy {
  private readonly _unitOfMeasureService: UnitOfMeasureService = inject(UnitOfMeasureService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  readonly _loading = signal(false);
  readonly _saving = signal(false);
  readonly _editingId = signal<number | null>(null);

  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(20)]],
  });

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    this._editingId.set(id);

    if (id) {
      this._loading.set(true);
      this._unitOfMeasureService
        .getAll()
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: (units: UnitOfMeasure[]) => {
            const unit = units.find((u) => u.id === id);
            if (unit) {
              this.form.patchValue({ name: unit.name, code: unit.code });
            }
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
    this._router.navigate(['/admin/units']);
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const dto: UnitOfMeasureDto = this.form.getRawValue();

    const onSuccess = (): void => {
      this._saving.set(false);
      this.goBack();
    };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._unitOfMeasureService.update(editingId, dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    } else {
      this._unitOfMeasureService.create(dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    }
  }
}
