import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputFieldComponent } from '@shared/components';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TaxTypeService } from '@shared/services/tax-type.service';
import { TaxType, TaxTypeDto } from '@shared/interfaces/tax-type.interface';

@Component({
  selector: 'app-tax-types',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent],
  templateUrl: './tax-types.component.html',
})
export class TaxTypesComponent implements OnInit, OnDestroy {
  private readonly _taxTypeService: TaxTypeService = inject(TaxTypeService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _confirmDialog: ConfirmDialogService = inject(ConfirmDialogService);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly _loading = signal(false);
  readonly _taxTypes = signal<TaxType[]>([]);
  readonly _search = signal('');

  readonly _filtered = computed(() => {
    const q = this._search().toLowerCase().trim();
    if (!q) return this._taxTypes();
    return this._taxTypes().filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
    );
  });

  readonly _total = computed(() => this._filtered().length);

  readonly _panelOpen = signal(false);
  readonly _saving = signal(false);
  readonly _editingId = signal<number | null>(null);

  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(50)]],
  });

  ngOnInit(): void {
    this._search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this._destroy$),
      )
      .subscribe((val) => this._search.set(val));
    this._load();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _load(): void {
    this._loading.set(true);
    this._taxTypeService
      .getAll()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (items) => {
          this._taxTypes.set(items);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  onSearch(value: string): void {
    this._search$.next(value);
  }

  openCreate(): void {
    this._editingId.set(null);
    this.form.reset();
    this._panelOpen.set(true);
  }

  openEdit(taxType: TaxType): void {
    this._editingId.set(taxType.id);
    this.form.patchValue({ name: taxType.name, code: taxType.code });
    this._panelOpen.set(true);
  }

  closePanel(): void {
    this._panelOpen.set(false);
    this._editingId.set(null);
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const dto: TaxTypeDto = this.form.getRawValue();

    const onSuccess = (): void => {
      this._saving.set(false);
      this.closePanel();
      this._load();
    };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._taxTypeService
        .update(editingId, dto)
        .pipe(takeUntil(this._destroy$))
        .subscribe({ next: onSuccess, error: onError });
    } else {
      this._taxTypeService
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
    this._taxTypeService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({ next: () => this._load() });
  }
}
