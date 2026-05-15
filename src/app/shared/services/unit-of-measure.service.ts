import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponseInterface, CreatedResponseInterface } from '@shared/interfaces/api-response.interface';
import { UnitOfMeasure } from '@shared/interfaces/product.interface';

export interface UnitOfMeasureDto {
  name: string;
  code: string;
}

@Injectable({ providedIn: 'root' })
export class UnitOfMeasureService {
  private readonly _http = inject(HttpClient);

  getAll(): Observable<UnitOfMeasure[]> {
    return this._http
      .get<ApiResponseInterface<UnitOfMeasure[]>>(`${environment.apiUrl}/units-of-measure`)
      .pipe(map((r) => r.data));
  }

  create(dto: UnitOfMeasureDto): Observable<{ rowId: string }> {
    return this._http
      .post<CreatedResponseInterface>(`${environment.apiUrl}/units-of-measure`, dto)
      .pipe(map((r) => r.data));
  }

  update(id: string, dto: Partial<UnitOfMeasureDto>): Observable<void> {
    return this._http.patch<void>(`${environment.apiUrl}/units-of-measure/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this._http.delete<void>(`${environment.apiUrl}/units-of-measure/${id}`);
  }
}
