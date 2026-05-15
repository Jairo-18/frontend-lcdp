import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  ApiResponseInterface,
  CreatedResponseInterface,
} from '@shared/interfaces/api-response.interface';
import {
  UnitOfMeasure,
  UnitOfMeasureDto,
} from '@shared/interfaces/product.interface';

@Injectable({ providedIn: 'root' })
export class UnitOfMeasureService {
  private readonly _http: HttpClient = inject(HttpClient);

  private _allCache$: Observable<UnitOfMeasure[]> | null = null;

  getAll(): Observable<UnitOfMeasure[]> {
    if (!this._allCache$) {
      this._allCache$ = this._http
        .get<
          ApiResponseInterface<UnitOfMeasure[]>
        >(`${environment.apiUrl}/units-of-measure`)
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

  create(dto: UnitOfMeasureDto): Observable<{ rowId: string }> {
    return this._http
      .post<CreatedResponseInterface>(
        `${environment.apiUrl}/units-of-measure`,
        dto,
      )
      .pipe(
        map((r) => r.data),
        tap(() => this._invalidateCache()),
      );
  }

  update(id: string, dto: Partial<UnitOfMeasureDto>): Observable<void> {
    return this._http
      .patch<void>(`${environment.apiUrl}/units-of-measure/${id}`, dto)
      .pipe(tap(() => this._invalidateCache()));
  }

  remove(id: string): Observable<void> {
    return this._http
      .delete<void>(`${environment.apiUrl}/units-of-measure/${id}`)
      .pipe(tap(() => this._invalidateCache()));
  }
}
