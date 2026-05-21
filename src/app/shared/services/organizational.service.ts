import { Injectable, PLATFORM_ID, inject, makeStateKey, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransferState } from '@angular/core';
import { environment } from '@env/environment';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';
import {
  Organizational,
  BootstrapData,
  CreateOrganizationalDto,
  UpdateOrganizationalDto,
} from '@shared/interfaces/organizational.interface';
import { resolveVariant } from '@shared/utilities/image-url.utils';

const BOOTSTRAP_KEY = makeStateKey<BootstrapData>('org_bootstrap');

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
  private readonly _transferState: TransferState = inject(TransferState);
  private readonly _platformId = inject(PLATFORM_ID);

  private _bootstrapCache$: Observable<BootstrapData> | null = null;

  private readonly _ready = signal(false);
  readonly isReady = this._ready.asReadonly();

  private readonly _org = signal<Organizational | null>(null);
  readonly org = this._org.asReadonly();

  bootstrap(): Observable<BootstrapData> {
    if (this._bootstrapCache$) return this._bootstrapCache$;

    // Client: use data transferred from SSR — no HTTP needed, no flash
    if (isPlatformBrowser(this._platformId) && this._transferState.hasKey(BOOTSTRAP_KEY)) {
      const data = this._transferState.get(BOOTSTRAP_KEY, null as unknown as BootstrapData);
      this._transferState.remove(BOOTSTRAP_KEY);
      this._org.set(data.org);
      this._ready.set(true);
      this._bootstrapCache$ = of(data).pipe(shareReplay(1));
      return this._bootstrapCache$;
    }

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
        tap((data) => {
          this._org.set(data.org);
          this._ready.set(true);
          // Server: store data so the client can read it on hydration
          if (!isPlatformBrowser(this._platformId)) {
            this._transferState.set(BOOTSTRAP_KEY, data);
          }
        }),
        shareReplay(1),
      );

    return this._bootstrapCache$;
  }

  markReady(): void {
    this._ready.set(true);
  }

  invalidateBootstrap(): void {
    this._bootstrapCache$ = null;
    this._ready.set(false);
    this._org.set(null);
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
