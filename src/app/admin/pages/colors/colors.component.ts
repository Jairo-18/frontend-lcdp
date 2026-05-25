import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent, SelectFieldComponent } from '@shared/components';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ColorService } from '@shared/services/color.service';
import { Color } from '@shared/interfaces/color.interface';

@Component({
  selector: 'app-colors',
  standalone: true,
  imports: [FormsModule, PaginatorComponent, SelectFieldComponent],
  templateUrl: './colors.component.html',
})
export class ColorsComponent implements OnInit, OnDestroy {
  private readonly _colorService: ColorService = inject(ColorService);
  private readonly _confirmDialog: ConfirmDialogService = inject(ConfirmDialogService);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly perPageOptions = [
    { value: '10', label: '10 por página' },
    { value: '25', label: '25 por página' },
    { value: '50', label: '50 por página' },
  ];

  readonly _loading    = signal(false);
  readonly _deletingId = signal<number | null>(null);
  readonly _colors     = signal<Color[]>([]);
  readonly _total      = signal(0);
  readonly _pageCount  = signal(0);
  readonly _page       = signal(1);
  readonly _perPage    = signal(25);
  readonly _search     = signal('');

  readonly _from = computed(() =>
    this._total() === 0 ? 0 : (this._page() - 1) * this._perPage() + 1,
  );
  readonly _to = computed(() =>
    Math.min(this._page() * this._perPage(), this._total()),
  );
  readonly _hasFilters = computed(() => !!this._search());

  ngOnInit(): void {
    this._search$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this._destroy$))
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
    this._colorService
      .getPaginated({
        page: this._page(),
        perPage: this._perPage(),
        search: this._search() || undefined,
      })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          this._colors.set(res.data);
          this._total.set(res.pagination.total);
          this._pageCount.set(res.pagination.pageCount);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  onSearch(value: string): void { this._search$.next(value); }

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
    this._router.navigate(['/admin/colors/create-or-edit-colors']);
  }

  openEdit(color: Color): void {
    this._router.navigate(['/admin/colors/create-or-edit-colors', color.id]);
  }

  confirmDelete(id: number, name: string): void {
    this._confirmDialog.confirmDelete(name).subscribe((confirmed) => {
      if (confirmed) this._doDelete(id);
    });
  }

  private _doDelete(id: number): void {
    this._deletingId.set(id);
    this._colorService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this._deletingId.set(null);
          if (this._colors().length === 1 && this._page() > 1)
            this._page.update((p) => p - 1);
          this._load();
        },
        error: () => this._deletingId.set(null),
      });
  }
}
