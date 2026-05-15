import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponseInterface, CreatedResponseInterface } from '@shared/interfaces/api-response.interface';
import { Brand } from '@shared/interfaces/brand.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
import { PaginatedResponse, PaginationParams } from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';

export interface BrandDto {
  name: string;
  code: string;
  images?: ImageVariant[];
}

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly _http = inject(HttpClient);
  private readonly _httpUtils = inject(HttpUtilitiesService);

  /** Para dropdowns: trae hasta 200 marcas sin paginación visible */
  getAll(): Observable<Brand[]> {
    const params = this._httpUtils.httpParamsFromObject({ limit: 200 });
    return this._http
      .get<ApiResponseInterface<PaginatedResponse<Brand>>>(`${environment.apiUrl}/brands`, { params })
      .pipe(map((r) => r.data.items));
  }

  getPaginated(params: PaginationParams & { search?: string }): Observable<PaginatedResponse<Brand>> {
    const httpParams = this._httpUtils.httpParamsFromObject(params as object);
    return this._http
      .get<ApiResponseInterface<PaginatedResponse<Brand>>>(`${environment.apiUrl}/brands`, { params: httpParams })
      .pipe(map((r) => r.data));
  }

  getOne(id: string): Observable<Brand> {
    return this._http
      .get<ApiResponseInterface<Brand>>(`${environment.apiUrl}/brands/${id}`)
      .pipe(map((r) => r.data));
  }

  create(dto: BrandDto): Observable<{ rowId: string }> {
    return this._http
      .post<CreatedResponseInterface>(`${environment.apiUrl}/brands`, dto)
      .pipe(map((r) => r.data));
  }

  update(id: string, dto: Partial<BrandDto>): Observable<void> {
    return this._http.patch<void>(`${environment.apiUrl}/brands/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this._http.delete<void>(`${environment.apiUrl}/brands/${id}`);
  }
}
