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
import { ImagePreviewService } from '@shared/services/image-preview.service';
import { Category } from '@shared/interfaces/category.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
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
  readonly _previewSvc: ImagePreviewService = inject(ImagePreviewService);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly _loading    = signal(false);
  readonly _categories = signal<Category[]>([]);
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
        perPage: this._perPage(),
        search: this._search() || undefined,
      })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          this._categories.set(res.data);
          this._total.set(res.pagination.total);
          this._pageCount.set(res.pagination.pageCount);
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

  prevPage(): void {
    if (this._page() <= 1) return;
    this._page.update((p) => p - 1);
    this._load();
  }

  nextPage(): void {
    if (this._page() >= this._pageCount()) return;
    this._page.update((p) => p + 1);
    this._load();
  }

  clearFilters(): void {
    this._search.set('');
    this._page.set(1);
    this._load();
  }

  openPreview(images: ImageVariant[], index = 0): void {
    this._previewSvc.open(images.map((v) => v.md), index);
  }

  openCreate(): void {
    this._router.navigate(['/admin/categories/create-or-edit-categories']);
  }

  openEdit(category: Category): void {
    this._router.navigate(['/admin/categories/create-or-edit-categories', category.id]);
  }

  confirmDelete(id: number, name: string): void {
    this._confirmDialog.confirmDelete(name).subscribe((confirmed) => {
      if (confirmed) this.doDelete(id);
    });
  }

  private doDelete(id: number): void {
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
