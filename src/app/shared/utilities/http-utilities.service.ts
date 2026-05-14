import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpUtilitiesService {
  httpParamsFromObject(queryParams: object): HttpParams {
    let params = new HttpParams();
    Object.keys(queryParams).forEach((key: string): void => {
      const value = queryParams[key as keyof typeof queryParams] as string;
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    return params;
  }
}
