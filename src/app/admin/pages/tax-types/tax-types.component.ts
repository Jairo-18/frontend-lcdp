import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputFieldComponent, PaginatorComponent } from '@shared/components';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TaxTypeService } from '@shared/services/tax-type.service';
import { TaxType, TaxTypeDto } from '@shared/interfaces/tax-type.interface';

@Component({
  selector: 'app-tax-types',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent, PaginatorComponent],
  templateUrl: './tax-types.component.html',
})
export class TaxTypesComponent implements OnInit, OnDestroy {
  private readonly _taxTypeService: TaxTypeService = inject(TaxTypeService);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _confirmDialog: ConfirmDialogService =
    inject(ConfirmDialogService);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly _loading = signal(false);
  readonly _taxTypes = signal<TaxType[]>([]);
  readonly _search = signal('');
  readonly _page = signal(1);
  readonly _perPage = signal(25);
  readonly _total = signal(0);
  readonly _pageCount = signal(0);

  readonly _from = computed(() =>
    this._total() === 0 ? 0 : (this._page() - 1) * this._perPage() + 1,
  );
  readonly _to = computed(() =>
    Math.min(this._page() * this._perPage(), this._total()),
  );
  readonly _hasFilters = computed(() => !!this._search());

  readonly _deletingId = signal<number | null>(null);
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
    this._taxTypeService
      .getPaginated({
        page: this._page(),
        perPage: this._perPage(),
        search: this._search() || undefined,
      })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: ({ data, pagination }) => {
          this._taxTypes.set(data);
          this._total.set(pagination.total);
          this._pageCount.set(pagination.pageCount);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  onSearch(value: string): void {
    this._search$.next(value);
  }

  onPerPageChange(value: string): void {
    this._perPage.set(Number(value));
    this._page.set(1);
    this._load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this._pageCount() || page === this._page()) return;
    this._page.set(page);
    this._load();
  }

  clearFilters(): void {
    this._search.set('');
    this._page.set(1);
    this._load();
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
    this._deletingId.set(id);
    this._taxTypeService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this._deletingId.set(null);
          this._load();
        },
        error: () => this._deletingId.set(null),
      });
  }
}
