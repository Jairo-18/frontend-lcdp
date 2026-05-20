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
import { BrandService } from '@shared/services/brand.service';
import { ImagePreviewService } from '@shared/services/image-preview.service';
import { Brand } from '@shared/interfaces/brand.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [],
  templateUrl: './brands.component.html',
})
export class BrandsComponent implements OnInit, OnDestroy {
  private readonly _brandService: BrandService = inject(BrandService);
  private readonly _confirmDialog: ConfirmDialogService = inject(ConfirmDialogService);
  private readonly _router: Router = inject(Router);
  readonly _previewSvc: ImagePreviewService = inject(ImagePreviewService);
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly _loading     = signal(false);
  readonly _deletingId  = signal<number | null>(null);
  readonly _brands    = signal<Brand[]>([]);
  readonly _total     = signal(0);
  readonly _pageCount = signal(0);
  readonly _page      = signal(1);
  readonly _perPage   = signal(25);
  readonly _search    = signal('');

  readonly _from = computed(() =>
    this._total() === 0 ? 0 : (this._page() - 1) * this._perPage() + 1,
  );
  readonly _to = computed(() =>
    Math.min(this._page() * this._perPage(), this._total()),
  );
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
    this._brandService
      .getPaginated({
        page: this._page(),
        perPage: this._perPage(),
        search: this._search() || undefined,
      })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          this._brands.set(res.data);
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

  goToPage(page: number | null): void {
    if (page === null || page < 1 || page > this._pageCount() || page === this._page()) return;
    this._page.set(page);
    this._load();
  }

  prevPage(): void { this.goToPage(this._page() - 1); }
  nextPage(): void { this.goToPage(this._page() + 1); }

  clearFilters(): void {
    this._search.set('');
    this._page.set(1);
    this._load();
  }

  openPreview(images: ImageVariant[], index = 0): void {
    this._previewSvc.open(images.map((v) => v.md), index);
  }

  openCreate(): void {
    this._router.navigate(['/admin/brands/create-or-edit-brands']);
  }

  openEdit(brand: Brand): void {
    this._router.navigate(['/admin/brands/create-or-edit-brands', brand.id]);
  }

  confirmDelete(id: number, name: string): void {
    this._confirmDialog.confirmDelete(name).subscribe((confirmed) => {
      if (confirmed) this.doDelete(id);
    });
  }

  private doDelete(id: number): void {
    this._deletingId.set(id);
    this._brandService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this._deletingId.set(null);
          if (this._brands().length === 1 && this._page() > 1)
            this._page.update((p) => p - 1);
          this._load();
        },
        error: () => this._deletingId.set(null),
      });
  }
}
