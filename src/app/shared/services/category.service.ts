import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponseInterface, CreatedResponseInterface } from '@shared/interfaces/api-response.interface';
import { Category } from '@shared/interfaces/category.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
import { PaginatedResponse, PaginationParams } from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';

export interface CategoryDto {
  name: string;
  code: string;
  images?: ImageVariant[];
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly _http = inject(HttpClient);
  private readonly _httpUtils = inject(HttpUtilitiesService);

  getPaginated(params: PaginationParams & { search?: string }): Observable<PaginatedResponse<Category>> {
    const httpParams = this._httpUtils.httpParamsFromObject(params as object);
    return this._http
      .get<ApiResponseInterface<PaginatedResponse<Category>>>(`${environment.apiUrl}/categories`, { params: httpParams })
      .pipe(map((r) => r.data));
  }

  getOne(id: string): Observable<Category> {
    return this._http
      .get<ApiResponseInterface<Category>>(`${environment.apiUrl}/categories/${id}`)
      .pipe(map((r) => r.data));
  }

  create(dto: CategoryDto): Observable<{ rowId: string }> {
    return this._http
      .post<CreatedResponseInterface>(`${environment.apiUrl}/categories`, dto)
      .pipe(map((r) => r.data));
  }

  update(id: string, dto: Partial<CategoryDto>): Observable<void> {
    return this._http.patch<void>(`${environment.apiUrl}/categories/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this._http.delete<void>(`${environment.apiUrl}/categories/${id}`);
  }
}
