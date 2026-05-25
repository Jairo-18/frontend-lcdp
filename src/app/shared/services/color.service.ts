import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  ApiResponseInterface,
  CreatedResponseInterface,
} from '@shared/interfaces/api-response.interface';
import { Color, ColorDto, ColorParams } from '@shared/interfaces/color.interface';
import {
  BasePaginationParams,
  PaginationInterface,
} from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';

@Injectable({ providedIn: 'root' })
export class ColorService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _httpUtils: HttpUtilitiesService = inject(HttpUtilitiesService);

  private _allCache$: Observable<Color[]> | null = null;

  getAll(): Observable<Color[]> {
    if (!this._allCache$) {
      const params = this._httpUtils.httpParamsFromObject({ perPage: 500 });
      this._allCache$ = this._http
        .get<ApiResponseInterface<{ data: Color[]; pagination: PaginationInterface }>>(
          `${environment.apiUrl}/colors`,
          { params },
        )
        .pipe(
          map((r) => r.data.data),
          shareReplay(1),
        );
    }
    return this._allCache$;
  }

  invalidateCache(): void {
    this._allCache$ = null;
  }

  getPaginated(
    params: BasePaginationParams & { search?: string; colorFamily?: string },
  ): Observable<{ data: Color[]; pagination: PaginationInterface }> {
    const httpParams = this._httpUtils.httpParamsFromObject(params);
    return this._http
      .get<ApiResponseInterface<{ data: Color[]; pagination: PaginationInterface }>>(
        `${environment.apiUrl}/colors`,
        { params: httpParams },
      )
      .pipe(map((r) => r.data));
  }

  getOne(id: number): Observable<Color> {
    return this._http
      .get<ApiResponseInterface<Color>>(`${environment.apiUrl}/colors/${id}`)
      .pipe(map((r) => r.data));
  }

  create(dto: ColorDto): Observable<{ rowId: number }> {
    return this._http
      .post<CreatedResponseInterface>(`${environment.apiUrl}/colors`, dto)
      .pipe(
        map((r) => r.data),
        tap(() => this.invalidateCache()),
      );
  }

  update(id: number, dto: Partial<ColorDto>): Observable<void> {
    return this._http
      .patch<void>(`${environment.apiUrl}/colors/${id}`, dto)
      .pipe(tap(() => this.invalidateCache()));
  }

  remove(id: number): Observable<void> {
    return this._http
      .delete<void>(`${environment.apiUrl}/colors/${id}`)
      .pipe(tap(() => this.invalidateCache()));
  }
}
