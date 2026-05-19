import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  ApiResponseInterface,
  CreatedResponseInterface,
} from '@shared/interfaces/api-response.interface';
import { Category, CategoryDto } from '@shared/interfaces/category.interface';
import {
  BasePaginationParams,
  PaginationInterface,
} from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';
import { resolveVariant } from '@shared/utilities/image-url.utils';

const resolveCategory = (c: Category): Category => ({
  ...c,
  images: c.images?.map(resolveVariant) ?? [],
});

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _httpUtils: HttpUtilitiesService = inject(HttpUtilitiesService);

  getPaginated(
    params: BasePaginationParams & { search?: string },
  ): Observable<{ data: Category[]; pagination: PaginationInterface }> {
    const httpParams = this._httpUtils.httpParamsFromObject(params);
    return this._http
      .get<ApiResponseInterface<{ data: Category[]; pagination: PaginationInterface }>>(
        `${environment.apiUrl}/categories`,
        { params: httpParams },
      )
      .pipe(map((r) => ({ ...r.data, data: r.data.data.map(resolveCategory) })));
  }

  getOne(id: number): Observable<Category> {
    return this._http
      .get<ApiResponseInterface<Category>>(`${environment.apiUrl}/categories/${id}`)
      .pipe(map((r) => resolveCategory(r.data)));
  }

  create(dto: CategoryDto): Observable<{ rowId: number }> {
    return this._http
      .post<CreatedResponseInterface>(`${environment.apiUrl}/categories`, dto)
      .pipe(map((r) => r.data));
  }

  update(id: number, dto: Partial<CategoryDto>): Observable<void> {
    return this._http.patch<void>(`${environment.apiUrl}/categories/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this._http.delete<void>(`${environment.apiUrl}/categories/${id}`);
  }
}
