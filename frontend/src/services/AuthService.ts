import { AuthApiClient } from '@/api/AuthApi';
import { StorageService } from './StorageService';
import { User } from '@/models/User';
import type { ILoginPayload, IRegisterPayload, IUserJSON } from '@/types/interfaces';

/**
 * Service orchestrating authentication business logic.
 *
 * OOP patterns:
 * - Singleton: one shared instance
 * - Composition: delegates to AuthApiClient and StorageService
 * - Facade: simplifies auth flow for consumers
 */
export class AuthService {
  private static instance: AuthService;
  private readonly api: AuthApiClient;
  private readonly storage: StorageService;

  private constructor() {
    this.api = new AuthApiClient();
    this.storage = StorageService.getInstance();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ─── Auth Operations ──────────────────────────────────────

  /**
   * Authenticate user with email/password.
   * Stores JWT token and user data on success.
   */
  async login(email: string, password: string): Promise<User> {
    const payload: ILoginPayload = { email, password };
    const response = await this.api.login(payload);

    this.storage.setToken(response.access_token);
    this.storage.set<IUserJSON>('user', response.user);

    return User.fromJSON(response.user);
  }

  /**
   * Register a new user account.
   * Stores JWT token and user data on success.
   */
  async register(payload: IRegisterPayload): Promise<User> {
    const response = await this.api.register(payload);

    this.storage.setToken(response.access_token);
    this.storage.set<IUserJSON>('user', response.user);

    return User.fromJSON(response.user);
  }

  /**
   * Clear all auth state and redirect to login.
   */
  logout(): void {
    this.storage.removeToken();
    this.storage.remove('user');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  /**
   * Fetch the current user from the server and refresh cached data.
   */
  async refreshCurrentUser(): Promise<User> {
    const userData = await this.api.getCurrentUser();
    this.storage.set<IUserJSON>('user', userData);
    return User.fromJSON(userData);
  }

  // ─── State Queries ────────────────────────────────────────

  /** Check if user is currently authenticated (has token) */
  isAuthenticated(): boolean {
    return this.storage.hasToken();
  }

  /** Get cached user from localStorage (no API call) */
  getCachedUser(): User | null {
    const data = this.storage.get<IUserJSON>('user');
    return data ? User.fromJSON(data) : null;
  }

  /** Get the stored JWT token */
  getToken(): string | null {
    return this.storage.getToken();
  }
}
