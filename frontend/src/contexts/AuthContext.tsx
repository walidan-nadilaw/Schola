import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { User } from '@/models/User';
import { AuthService } from '@/services/AuthService';
import type { IRegisterPayload } from '@/types/interfaces';

// ─── Context Shape ──────────────────────────────────────────

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: IRegisterPayload) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider — bridges the OOP AuthService singleton with React's
 * component tree via Context. Wraps class-based logic in React state.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const authService = AuthService.getInstance();

  const [user, setUser] = useState<User | null>(authService.getCachedUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for forced logout events (e.g., 401 from API interceptor)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setError(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
    } catch (err: unknown) {
      const message = (err as { detail?: string })?.detail ?? 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  const register = useCallback(async (payload: IRegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.register(payload);
      setUser(newUser);
    } catch (err: unknown) {
      const message = (err as { detail?: string })?.detail ?? 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, [authService]);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
