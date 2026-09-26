import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api.models';

export interface RequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, any>;
  reportProgress?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Resolves a full endpoint URL from a relative path.
   */
  public getFullUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${this.baseUrl}/${cleanPath}`;
  }

  public get<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(this.getFullUrl(path), this.formatOptions(options));
  }

  public post<T>(path: string, body: any, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.getFullUrl(path), body, this.formatOptions(options));
  }

  public put<T>(path: string, body: any, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.getFullUrl(path), body, this.formatOptions(options));
  }

  public patch<T>(path: string, body: any, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.getFullUrl(path), body, this.formatOptions(options));
  }

  public delete<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.getFullUrl(path), this.formatOptions(options));
  }

  /**
   * Downloads a binary file (e.g. CSV/Excel report or PDF export).
   */
  public downloadBlob(path: string, options?: RequestOptions): Observable<Blob> {
    return this.http.get(this.getFullUrl(path), {
      ...this.formatOptions(options),
      responseType: 'blob',
    });
  }

  private formatOptions(options?: RequestOptions): { headers?: HttpHeaders; params?: HttpParams } {
    if (!options) return {};

    let params: HttpParams | undefined;
    if (options.params) {
      if (options.params instanceof HttpParams) {
        params = options.params;
      } else {
        let httpParams = new HttpParams();
        const rawParams = options.params as Record<string, any>;
        Object.keys(rawParams).forEach((key) => {
          const val = rawParams[key];
          if (val !== undefined && val !== null && val !== '') {
            httpParams = httpParams.set(key, String(val));
          }
        });
        params = httpParams;
      }
    }

    let headers: HttpHeaders | undefined;
    if (options.headers) {
      if (options.headers instanceof HttpHeaders) {
        headers = options.headers;
      } else {
        headers = new HttpHeaders(options.headers);
      }
    }

    return { headers, params };
  }
}
