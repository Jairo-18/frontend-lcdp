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
import { resolveVariant } from '@shared/utilities/image-url.utils';

const resolveUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
};

const resolveOrg = (org: Organizational | null): Organizational | null => {
  if (!org) return null;
  return {
    ...org,
    logoUrl: resolveUrl(org.logoUrl),
    faviconUrl: resolveUrl(org.faviconUrl),
  };
};

@Injectable({ providedIn: 'root' })
export class OrganizationalService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  private _bootstrapCache$: Observable<BootstrapData> | null = null;

  bootstrap(): Observable<BootstrapData> {
    if (!this._bootstrapCache$) {
      this._bootstrapCache$ = this._httpClient
        .get<ApiResponseInterface<BootstrapData>>(`${environment.apiUrl}/organizational/bootstrap`)
        .pipe(
          map((r) => ({
            org: resolveOrg(r.data.org),
            categories: r.data.categories,
            units: r.data.units,
            brands: r.data.brands.map((b) => ({ ...b, images: b.images?.map(resolveVariant) ?? [] })),
            taxTypes: r.data.taxTypes,
          })),
          shareReplay(1),
        );
    }
    return this._bootstrapCache$;
  }

  invalidateBootstrap(): void {
    this._bootstrapCache$ = null;
  }

  get(): Observable<Organizational> {
    return this._httpClient
      .get<ApiResponseInterface<Organizational>>(`${environment.apiUrl}/organizational`)
      .pipe(map((r) => resolveOrg(r.data)!));
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
