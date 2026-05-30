import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponseInterface, CreatedResponseInterface } from '@shared/interfaces/api-response.interface';
import { HttpParamValue } from '@shared/utilities/http-utilities.service';
import { Certification, CertificationDto } from '@shared/interfaces/certification.interface';
import { BasePaginationParams, PaginationInterface } from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';

@Injectable({ providedIn: 'root' })
export class CertificationService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _httpUtils: HttpUtilitiesService = inject(HttpUtilitiesService);

  private get _base(): string { return `${environment.apiUrl}/certifications`; }
  private get _public(): string { return `${environment.apiUrl}/public/certifications`; }

  getAllActive(): Observable<Certification[]> {
    return this._http
      .get<ApiResponseInterface<Certification[]>>(this._public)
      .pipe(map((r) => r.data));
  }

  getPaginated(params: BasePaginationParams): Observable<{ data: Certification[]; pagination: PaginationInterface }> {
    const query = this._httpUtils.httpParamsFromObject(params as Record<string, HttpParamValue>);
    return this._http
      .get<ApiResponseInterface<{ data: Certification[]; pagination: PaginationInterface }>>(this._base, { params: query })
      .pipe(map((r) => r.data));
  }

  getOne(id: number): Observable<Certification> {
    return this._http
      .get<ApiResponseInterface<Certification>>(`${this._base}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(dto: CertificationDto): Observable<{ rowId: number }> {
    return this._http
      .post<CreatedResponseInterface>(this._base, dto)
      .pipe(map((r) => ({ rowId: r.data.rowId })));
  }

  update(id: number, dto: Partial<CertificationDto>): Observable<void> {
    return this._http
      .patch<void>(`${this._base}/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }
}
