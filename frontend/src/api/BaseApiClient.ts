import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { IApiError } from '@/types/interfaces';

/**
 * Abstract base class for all API clients.
 *
 * OOP principles:
 * - Abstraction: common HTTP logic encapsulated
 * - Inheritance: concrete API clients extend this
 * - Template Method: subclasses use protected request methods
 */
export abstract class BaseApiClient {
  protected readonly http: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.http = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15_000,
    });

    this.setupInterceptors();
  }

  // ─── Interceptors ─────────────────────────────────────────

  private setupInterceptors(): void {
    // Request interceptor: attach JWT token
    this.http.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor: normalize errors
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const apiError: IApiError = {
            detail: error.response.data?.detail ?? 'An unknown error occurred',
            status_code: error.response.status,
          };

          // Auto-logout on 401
          if (error.response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }

          return Promise.reject(apiError);
        }

        return Promise.reject({
          detail: error.message ?? 'Network error',
        } as IApiError);
      },
    );
  }

  // ─── Protected HTTP Methods ───────────────────────────────

  protected async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.http.get(path, config);
    return response.data;
  }

  protected async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.http.post(path, data, config);
    return response.data;
  }

  protected async put<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.http.put(path, data, config);
    return response.data;
  }

  protected async patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.http.patch(path, data, config);
    return response.data;
  }

  protected async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.http.delete(path, config);
    return response.data;
  }
}
