import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { UnitOfMeasureService } from '@shared/services/unit-of-measure.service';
import { UnitOfMeasure } from '@shared/interfaces/product.interface';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [],
  templateUrl: './units.component.html',
})
export class UnitsComponent implements OnInit, OnDestroy {
  private readonly _unitOfMeasureService: UnitOfMeasureService = inject(UnitOfMeasureService);
  private readonly _confirmDialog: ConfirmDialogService = inject(ConfirmDialogService);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly _loading    = signal(false);
  readonly _deletingId = signal<number | null>(null);
  readonly _units    = signal<UnitOfMeasure[]>([]);
  readonly _search   = signal('');
  readonly _page     = signal(1);
  readonly _perPage  = signal(25);

  readonly _filtered = computed(() => {
    const q = this._search().toLowerCase().trim();
    if (!q) return this._units();
    return this._units().filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q),
    );
  });

  readonly _total     = computed(() => this._filtered().length);
  readonly _pageCount = computed(() => Math.max(1, Math.ceil(this._total() / this._perPage())));
  readonly _from      = computed(() => this._total() === 0 ? 0 : (this._page() - 1) * this._perPage() + 1);
  readonly _to        = computed(() => Math.min(this._page() * this._perPage(), this._total()));

  readonly _paginated = computed(() => {
    const start = (this._page() - 1) * this._perPage();
    return this._filtered().slice(start, start + this._perPage());
  });

  readonly pageNumbers = computed(() => {
    const total = this._pageCount();
    const current = this._page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | null)[];
    const pages: (number | null)[] = [1];
    if (current > 3) pages.push(null);
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
    if (current < total - 2) pages.push(null);
    pages.push(total);
    return pages;
  });

  readonly _hasFilters = computed(() => !!this._search());

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
      });
    this._load();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _load(): void {
    this._loading.set(true);
    this._unitOfMeasureService
      .getAll()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (units) => {
          this._units.set(units);
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
  }

  goToPage(page: number | null): void {
    if (page === null || page < 1 || page > this._pageCount() || page === this._page()) return;
    this._page.set(page);
  }

  prevPage(): void { this.goToPage(this._page() - 1); }
  nextPage(): void { this.goToPage(this._page() + 1); }

  clearFilters(): void {
    this._search.set('');
    this._page.set(1);
  }

  openCreate(): void {
    this._router.navigate(['/admin/units/create-or-edit-units']);
  }

  openEdit(unit: UnitOfMeasure): void {
    this._router.navigate(['/admin/units/create-or-edit-units', unit.id]);
  }

  confirmDelete(id: number, name: string): void {
    this._confirmDialog.confirmDelete(name).subscribe((confirmed) => {
      if (confirmed) this.doDelete(id);
    });
  }

  private doDelete(id: number): void {
    this._deletingId.set(id);
    this._unitOfMeasureService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => { this._deletingId.set(null); this._load(); },
        error: () => this._deletingId.set(null),
      });
  }
}
