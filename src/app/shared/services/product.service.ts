import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  ApiResponseInterface,
  CreatedResponseInterface,
} from '@shared/interfaces/api-response.interface';
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductParams,
} from '@shared/interfaces/product.interface';
import { PaginationInterface } from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';
import { resolveVariant } from '@shared/utilities/image-url.utils';

const resolveProduct = (p: Product): Product => ({
  ...p,
  presentations: p.presentations?.map((pres) => ({
    ...pres,
    images: pres.images?.map((img) => ({ ...img, variants: resolveVariant(img.variants) })) ?? [],
  })) ?? [],
});

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _httpUtils: HttpUtilitiesService = inject(HttpUtilitiesService);

  getAll(params: ProductParams): Observable<{ data: Product[]; pagination: PaginationInterface }> {
    const httpParams = this._httpUtils.httpParamsFromObject(params);
    return this._http
      .get<ApiResponseInterface<{ data: Product[]; pagination: PaginationInterface }>>(
        `${environment.apiUrl}/products`,
        { params: httpParams },
      )
      .pipe(map((r) => ({ ...r.data, data: r.data.data.map(resolveProduct) })));
  }

  getPublic(params: ProductParams): Observable<{ data: Product[]; pagination: PaginationInterface }> {
    const httpParams = this._httpUtils.httpParamsFromObject(params);
    return this._http
      .get<ApiResponseInterface<{ data: Product[]; pagination: PaginationInterface }>>(
        `${environment.apiUrl}/public/products`,
        { params: httpParams },
      )
      .pipe(map((r) => ({ ...r.data, data: r.data.data.map(resolveProduct) })));
  }

  getPublicOne(id: number): Observable<Product> {
    return this._http
      .get<ApiResponseInterface<Product>>(`${environment.apiUrl}/public/products/${id}`)
      .pipe(map((r) => resolveProduct(r.data)));
  }

  getOne(id: number): Observable<Product> {
    return this._http
      .get<ApiResponseInterface<Product>>(`${environment.apiUrl}/products/${id}`)
      .pipe(map((r) => resolveProduct(r.data)));
  }

  create(dto: CreateProductDto): Observable<{ rowId: number }> {
    return this._http
      .post<CreatedResponseInterface>(`${environment.apiUrl}/products`, dto)
      .pipe(map((r) => r.data));
  }

  update(id: number, dto: UpdateProductDto): Observable<void> {
    return this._http.patch<void>(`${environment.apiUrl}/products/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this._http.delete<void>(`${environment.apiUrl}/products/${id}`);
  }
}
