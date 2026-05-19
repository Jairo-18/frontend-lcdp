import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type HttpParamValue = string | number | boolean | undefined | null;

@Injectable({ providedIn: 'root' })
export class HttpUtilitiesService {
  httpParamsFromObject(queryParams: Record<string, HttpParamValue>): HttpParams {
    return Object.entries(queryParams).reduce((params, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        return params.set(key, String(value));
      }
      return params;
    }, new HttpParams());
  }
}
