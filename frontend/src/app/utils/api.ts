/**
 * api.ts — Central API client.
 * Base URL and token key read from Vite env vars (never hardcoded).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
export const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY ?? 'schola_token';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  // Build query string
  let url = `${BASE_URL}${path}`;
  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) sp.append(k, String(v));
    });
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }

  // Auth header
  const defaultHeaders: Record<string, string> = {};
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    headers: { ...defaultHeaders, ...headers },
    ...rest,
  });

  if (!response.ok) {
    let detail = 'Terjadi kesalahan sistem';
    try {
      const err = await response.json();
      detail = err.detail ?? err.message ?? detail;
    } catch (_) {
      /* JSON parse failed — use default */
    }

    // Auto logout on 401 — only redirect if user had an active session
    if (response.status === 401) {
      const hadToken = !!localStorage.getItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      if (hadToken) window.location.href = '/';
    }

    throw new Error(detail);
  }

  if (response.status === 204) return null as unknown as T;
  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) => {
    const isForm = body instanceof FormData;
    return request<T>(path, {
      method: 'POST',
      body: isForm ? body : JSON.stringify(body),
      ...options,
    });
  },

  put: <T>(path: string, body?: unknown, options?: RequestOptions) => {
    const isForm = body instanceof FormData;
    return request<T>(path, {
      method: 'PUT',
      body: isForm ? body : JSON.stringify(body),
      ...options,
    });
  },

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'DELETE', ...options }),

  upload: async (
    file: File
  ): Promise<{ file_path: string; file_name: string; file_size: number; file_type: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/files/upload', { method: 'POST', body: fd });
  },
};
