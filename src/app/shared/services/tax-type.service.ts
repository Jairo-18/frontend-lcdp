import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  ApiResponseInterface,
  CreatedResponseInterface,
} from '@shared/interfaces/api-response.interface';
import { TaxType, TaxTypeDto } from '@shared/interfaces/tax-type.interface';
import {
  BasePaginationParams,
  PaginationInterface,
} from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';
import { OrganizationalService } from '@shared/services/organizational.service';

@Injectable({ providedIn: 'root' })
export class TaxTypeService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _httpUtils: HttpUtilitiesService = inject(HttpUtilitiesService);
  private readonly _orgService: OrganizationalService = inject(OrganizationalService);

  private _allCache$: Observable<TaxType[]> | null = null;

  getAll(): Observable<TaxType[]> {
    if (!this._allCache$) {
      this._allCache$ = this._http
        .get<ApiResponseInterface<{ data: TaxType[]; pagination: PaginationInterface }>>(
          `${environment.apiUrl}/tax-types`,
          { params: { perPage: '200' } },
        )
        .pipe(
          map((r) => r.data.data),
          shareReplay(1),
        );
    }
    return this._allCache$;
  }

  getPaginated(
    params: BasePaginationParams,
  ): Observable<{ data: TaxType[]; pagination: PaginationInterface }> {
    const httpParams = this._httpUtils.httpParamsFromObject(params);
    return this._http
      .get<ApiResponseInterface<{ data: TaxType[]; pagination: PaginationInterface }>>(
        `${environment.apiUrl}/tax-types`,
        { params: httpParams },
      )
      .pipe(map((r) => r.data));
  }

  private _invalidateCache(): void {
    this._allCache$ = null;
    this._orgService.invalidateBootstrap();
  }

  create(dto: TaxTypeDto): Observable<{ rowId: number }> {
    return this._http
      .post<CreatedResponseInterface>(`${environment.apiUrl}/tax-types`, dto)
      .pipe(
        map((r) => r.data),
        tap(() => this._invalidateCache()),
      );
  }

  update(id: number, dto: Partial<TaxTypeDto>): Observable<void> {
    return this._http
      .patch<void>(`${environment.apiUrl}/tax-types/${id}`, dto)
      .pipe(tap(() => this._invalidateCache()));
  }

  remove(id: number): Observable<void> {
    return this._http
      .delete<void>(`${environment.apiUrl}/tax-types/${id}`)
      .pipe(tap(() => this._invalidateCache()));
  }
}
