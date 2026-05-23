import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';
import { Video, VideoDto } from '@shared/interfaces/video.interface';
import {
  BasePaginationParams,
  PaginationInterface,
} from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _httpUtils: HttpUtilitiesService = inject(HttpUtilitiesService);

  getPublic(
    params: BasePaginationParams,
  ): Observable<{ data: Video[]; pagination: PaginationInterface }> {
    const httpParams = this._httpUtils.httpParamsFromObject(params);
    return this._http
      .get<ApiResponseInterface<{ data: Video[]; pagination: PaginationInterface }>>(
        `${environment.apiUrl}/videos`,
        { params: httpParams },
      )
      .pipe(map((r) => r.data));
  }

  getPaginated(
    params: BasePaginationParams & { search?: string },
  ): Observable<{ data: Video[]; pagination: PaginationInterface }> {
    const httpParams = this._httpUtils.httpParamsFromObject(params);
    return this._http
      .get<ApiResponseInterface<{ data: Video[]; pagination: PaginationInterface }>>(
        `${environment.apiUrl}/videos`,
        { params: httpParams },
      )
      .pipe(map((r) => r.data));
  }

  getOne(id: string): Observable<Video> {
    return this._http
      .get<ApiResponseInterface<Video>>(`${environment.apiUrl}/videos/${id}`)
      .pipe(map((r) => r.data));
  }

  create(dto: VideoDto): Observable<{ rowId: string }> {
    return this._http
      .post<ApiResponseInterface<{ rowId: string }>>(`${environment.apiUrl}/videos`, dto)
      .pipe(map((r) => r.data));
  }

  update(id: string, dto: Partial<VideoDto>): Observable<void> {
    return this._http.patch<void>(`${environment.apiUrl}/videos/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this._http.delete<void>(`${environment.apiUrl}/videos/${id}`);
  }
}
