import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponseInterface, CreatedResponseInterface } from '@shared/interfaces/api-response.interface';
import { Product } from '@shared/interfaces/product.interface';
import { PaginatedResponse, PaginationParams } from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';

export interface CreatePresentationDto {
  unitOfMeasureId: string;
  sku?: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  categoryId: string;
  brandId: string;
  videoUrl?: string;
  technicalSheet?: Record<string, string | number | boolean>;
  presentations?: CreatePresentationDto[];
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductParams extends PaginationParams {
  categoryId?: string;
  brandId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly _http = inject(HttpClient);
  private readonly _httpUtils = inject(HttpUtilitiesService);

  getAll(params: ProductParams): Observable<PaginatedResponse<Product>> {
    const httpParams = this._httpUtils.httpParamsFromObject(params as object);
    return this._http
      .get<ApiResponseInterface<PaginatedResponse<Product>>>(
        `${environment.apiUrl}/products`,
        { params: httpParams },
      )
      .pipe(map((r) => r.data));
  }

  getOne(id: string): Observable<Product> {
    return this._http
      .get<ApiResponseInterface<Product>>(`${environment.apiUrl}/products/${id}`)
      .pipe(map((r) => r.data));
  }

  create(dto: CreateProductDto): Observable<{ rowId: string }> {
    return this._http
      .post<CreatedResponseInterface>(`${environment.apiUrl}/products`, dto)
      .pipe(map((r) => r.data));
  }

  update(id: string, dto: UpdateProductDto): Observable<void> {
    return this._http
      .patch<void>(`${environment.apiUrl}/products/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this._http
      .delete<void>(`${environment.apiUrl}/products/${id}`);
  }
}
