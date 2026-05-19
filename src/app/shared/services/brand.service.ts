import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  ApiResponseInterface,
  CreatedResponseInterface,
} from '@shared/interfaces/api-response.interface';
import { Brand, BrandDto } from '@shared/interfaces/brand.interface';
import {
  BasePaginationParams,
  PaginationInterface,
} from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';
import { resolveVariant } from '@shared/utilities/image-url.utils';
import { OrganizationalService } from '@shared/services/organizational.service';

const resolveBrand = (b: Brand): Brand => ({
  ...b,
  images: b.images?.map(resolveVariant) ?? [],
});

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _httpUtils: HttpUtilitiesService = inject(HttpUtilitiesService);
  private readonly _orgService: OrganizationalService = inject(OrganizationalService);

  private _allCache$: Observable<Brand[]> | null = null;

  getAll(): Observable<Brand[]> {
    if (!this._allCache$) {
      const params = this._httpUtils.httpParamsFromObject({ perPage: 200 });
      this._allCache$ = this._http
        .get<ApiResponseInterface<{ data: Brand[]; pagination: PaginationInterface }>>(
          `${environment.apiUrl}/brands`,
          { params },
        )
        .pipe(
          map((r) => r.data.data.map(resolveBrand)),
          shareReplay(1),
        );
    }
    return this._allCache$;
  }

  private _invalidateCache(): void {
    this._allCache$ = null;
    this._orgService.invalidateBootstrap();
  }

  getPaginated(
    params: BasePaginationParams & { search?: string },
  ): Observable<{ data: Brand[]; pagination: PaginationInterface }> {
    const httpParams = this._httpUtils.httpParamsFromObject(params);
    return this._http
      .get<ApiResponseInterface<{ data: Brand[]; pagination: PaginationInterface }>>(
        `${environment.apiUrl}/brands`,
        { params: httpParams },
      )
      .pipe(map((r) => ({ ...r.data, data: r.data.data.map(resolveBrand) })));
  }

  getOne(id: number): Observable<Brand> {
    return this._http
      .get<ApiResponseInterface<Brand>>(`${environment.apiUrl}/brands/${id}`)
      .pipe(map((r) => resolveBrand(r.data)));
  }

  create(dto: BrandDto): Observable<{ rowId: number }> {
    return this._http
      .post<CreatedResponseInterface>(`${environment.apiUrl}/brands`, dto)
      .pipe(
        map((r) => r.data),
        tap(() => this._invalidateCache()),
      );
  }

  update(id: number, dto: Partial<BrandDto>): Observable<void> {
    return this._http
      .patch<void>(`${environment.apiUrl}/brands/${id}`, dto)
      .pipe(tap(() => this._invalidateCache()));
  }

  remove(id: number): Observable<void> {
    return this._http
      .delete<void>(`${environment.apiUrl}/brands/${id}`)
      .pipe(tap(() => this._invalidateCache()));
  }
}
