import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponseInterface } from '@shared/interfaces/api-response.interface';
import { Brand } from '@shared/interfaces/brand.interface';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly _http = inject(HttpClient);

  getAll(): Observable<Brand[]> {
    return this._http
      .get<ApiResponseInterface<Brand[]>>(`${environment.apiUrl}/brands`)
      .pipe(map((r) => r.data));
  }
}
