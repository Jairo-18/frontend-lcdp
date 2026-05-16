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
import { Brand } from '@shared/interfaces/brand.interface';
import { environment } from '@env/environment';

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
  private readonly _destroy$: Subject<void> = new Subject<void>();
  private readonly _search$: Subject<string> = new Subject<string>();

  readonly apiUrl: string = environment.apiUrl;

  readonly _loading = signal(false);
  readonly _brands = signal<Brand[]>([]);
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
    this._brandService
      .getPaginated({
        page: this._page(),
        limit: this._limit(),
        search: this._search() || undefined,
      })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          this._brands.set(res.items);
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
    this._router.navigate(['/admin/brands/create-or-edit-brands']);
  }

  openEdit(brand: Brand): void {
    this._router.navigate(['/admin/brands/create-or-edit-brands', brand.id]);
  }

  confirmDelete(id: string, name: string): void {
    this._confirmDialog.confirmDelete(name).subscribe((confirmed) => {
      if (confirmed) this.doDelete(id);
    });
  }

  private doDelete(id: string): void {
    this._brandService
      .remove(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          if (this._brands().length === 1 && this._page() > 1)
            this._page.update((p) => p - 1);
          this._load();
        },
      });
  }

}
