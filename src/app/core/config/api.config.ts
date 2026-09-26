import { InjectionToken, ValueProvider } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  retryAttempts: number;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: environment.apiUrl,
  timeoutMs: 30000,
  retryAttempts: 1,
};

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_API_CONFIG,
});

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});

export function provideApiConfig(config?: Partial<ApiConfig>): ValueProvider {
  return {
    provide: API_CONFIG,
    useValue: { ...DEFAULT_API_CONFIG, ...config },
  };
}
