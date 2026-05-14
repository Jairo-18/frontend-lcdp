import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';
import {
  Organizational,
  BootstrapData,
  CreateOrganizationalDto,
  UpdateOrganizationalDto,
} from '@shared/interfaces/organizational.interface';

@Injectable({ providedIn: 'root' })
export class OrganizationalService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  private readonly _bootstrap$: Observable<BootstrapData> = this._httpClient
    .get<ApiResponseInterface<BootstrapData>>(`${environment.apiUrl}/organizational/bootstrap`)
    .pipe(map((r) => r.data), shareReplay(1));

  bootstrap(): Observable<BootstrapData> {
    return this._bootstrap$;
  }

  get(): Observable<Organizational> {
    return this._httpClient
      .get<ApiResponseInterface<Organizational>>(`${environment.apiUrl}/organizational`)
      .pipe(map((r) => r.data));
  }

  create(body: CreateOrganizationalDto): Observable<Organizational> {
    return this._httpClient
      .post<ApiResponseInterface<Organizational>>(`${environment.apiUrl}/organizational`, body)
      .pipe(map((r) => r.data));
  }

  update(id: string, body: UpdateOrganizationalDto): Observable<Organizational> {
    return this._httpClient
      .patch<ApiResponseInterface<Organizational>>(`${environment.apiUrl}/organizational/${id}`, body)
      .pipe(map((r) => r.data));
  }
}
