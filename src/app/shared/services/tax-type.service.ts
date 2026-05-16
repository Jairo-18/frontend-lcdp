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

@Injectable({ providedIn: 'root' })
export class TaxTypeService {
  private readonly _http: HttpClient = inject(HttpClient);

  private _allCache$: Observable<TaxType[]> | null = null;

  getAll(): Observable<TaxType[]> {
    if (!this._allCache$) {
      this._allCache$ = this._http
        .get<ApiResponseInterface<TaxType[]>>(`${environment.apiUrl}/tax-types`)
        .pipe(
          map((r) => r.data),
          shareReplay(1),
        );
    }
    return this._allCache$;
  }

  private _invalidateCache(): void {
    this._allCache$ = null;
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
