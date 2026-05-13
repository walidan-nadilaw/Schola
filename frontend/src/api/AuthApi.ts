import { BaseApiClient } from './BaseApiClient';
import type { IAuthResponse, ILoginPayload, IRegisterPayload, IUserJSON } from '@/types/interfaces';

/**
 * API client for authentication endpoints.
 * Extends BaseApiClient — inherits HTTP methods, JWT interceptor, error handling.
 */
export class AuthApiClient extends BaseApiClient {
  /** POST /auth/login */
  async login(payload: ILoginPayload): Promise<IAuthResponse> {
    return this.post<IAuthResponse>('/auth/login', payload);
  }

  /** POST /auth/register */
  async register(payload: IRegisterPayload): Promise<IAuthResponse> {
    return this.post<IAuthResponse>('/auth/register', payload);
  }

  /** GET /auth/me — returns current authenticated user */
  async getCurrentUser(): Promise<IUserJSON> {
    return this.get<IUserJSON>('/auth/me');
  }
}
