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
import { CategoryService } from '@shared/services/category.service';
import { Category } from '@shared/interfaces/category.interface';
import { environment } from '@env/environment';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private readonly _categoryService: CategoryService = inject(CategoryService);
  private readonly _confirmDialog: ConfirmDialogService = inject(ConfirmDialogService);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly apiUrl: string = environment.apiUrl;

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
    this._router.navigate(['/admin/categories/create-or-edit-categories']);
  }

  openEdit(category: Category): void {
    this._router.navigate(['/admin/categories/create-or-edit-categories', category.id]);
  }

  confirmDelete(id: string, name: string): void {
    this._confirmDialog.confirmDelete(name).subscribe((confirmed) => {
      if (confirmed) this.doDelete(id);
    });
  }

  private doDelete(id: string): void {
    this._categoryService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          if (this._categories().length === 1 && this._page() > 1)
            this._page.update((p) => p - 1);
          this._load();
        },
      });
  }
}
