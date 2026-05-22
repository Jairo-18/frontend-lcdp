import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';
import { Video } from '@shared/interfaces/video.interface';
import {
  BasePaginationParams,
  PaginationInterface,
} from '@shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '@shared/utilities/http-utilities.service';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _httpUtils: HttpUtilitiesService = inject(
    HttpUtilitiesService,
  );

  getPublic(
    params: BasePaginationParams,
  ): Observable<{ data: Video[]; pagination: PaginationInterface }> {
    const httpParams = this._httpUtils.httpParamsFromObject(params);
    return this._http
      .get<
        ApiResponseInterface<{ data: Video[]; pagination: PaginationInterface }>
      >(`${environment.apiUrl}/videos`, { params: httpParams })
      .pipe(map((r) => r.data));
  }
}
