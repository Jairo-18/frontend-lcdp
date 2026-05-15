import {
  Component, OnDestroy, OnInit, computed, inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { UnitOfMeasureService, UnitOfMeasureDto } from '@shared/services/unit-of-measure.service';
import { UnitOfMeasure } from '@shared/interfaces/product.interface';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './units.component.html',
})
export class UnitsComponent implements OnInit, OnDestroy {
  private readonly _unitService = inject(UnitOfMeasureService);
  private readonly _fb = inject(FormBuilder);
  private readonly _destroy$ = new Subject<void>();
  private readonly _search$ = new Subject<string>();

  // ── List ──────────────────────────────────────────────────────────────────
  readonly _loading    = signal(false);
  readonly _units      = signal<UnitOfMeasure[]>([]);
  readonly _search     = signal('');
  readonly _deletingId = signal<string | null>(null);

  readonly _filtered = computed(() => {
    const q = this._search().toLowerCase().trim();
    if (!q) return this._units();
    return this._units().filter(
      (u) => u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q),
    );
  });

  readonly _total = computed(() => this._filtered().length);

  // ── Panel ─────────────────────────────────────────────────────────────────
  readonly _panelOpen = signal(false);
  readonly _saving    = signal(false);
  readonly _editingId = signal<string | null>(null);

  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(20)]],
  });

  ngOnInit(): void {
    this._search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this._destroy$),
    ).subscribe((val) => this._search.set(val));
    this._load();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _load(): void {
    this._loading.set(true);
    this._unitService.getAll().pipe(takeUntil(this._destroy$)).subscribe({
      next: (units) => {
        this._units.set(units);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  onSearch(value: string): void { this._search$.next(value); }

  // ── Panel ─────────────────────────────────────────────────────────────────
  openCreate(): void {
    this._editingId.set(null);
    this.form.reset();
    this._panelOpen.set(true);
  }

  openEdit(unit: UnitOfMeasure): void {
    this._editingId.set(unit.id);
    this.form.patchValue({ name: unit.name, code: unit.code });
    this._panelOpen.set(true);
  }

  closePanel(): void {
    this._panelOpen.set(false);
    this._editingId.set(null);
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const dto: UnitOfMeasureDto = this.form.getRawValue();

    const onSuccess = (): void => {
      this._saving.set(false);
      this.closePanel();
      this._load();
    };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._unitService.update(editingId, dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    } else {
      this._unitService.create(dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(id: string): void { this._deletingId.set(id); }
  cancelDelete(): void            { this._deletingId.set(null); }

  doDelete(id: string): void {
    this._unitService.remove(id).pipe(takeUntil(this._destroy$)).subscribe({
      next: () => {
        this._deletingId.set(null);
        this._load();
      },
      error: () => this._deletingId.set(null),
    });
  }
}
