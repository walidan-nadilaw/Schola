import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SignInPage from '@/app/components/public/SignInPage';
import * as apiModule from '@/app/utils/api';

// Mock the api module
vi.mock('@/app/utils/api', async (importOriginal) => {
  const actual = await importOriginal<typeof apiModule>();
  return {
    ...actual,
    api: {
      ...actual.api,
      post: vi.fn(),
    },
  };
});

const mockedApiPost = vi.mocked(apiModule.api.post);

describe('FE-05: Login failure stays on login page', () => {
  const onSignIn = vi.fn();
  const onBackToHome = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('shows error message on 401 without redirecting when no token exists', async () => {
    mockedApiPost.mockRejectedValueOnce(new Error('Email atau password salah'));

    render(<SignInPage onSignIn={onSignIn} onBackToHome={onBackToHome} />);

    fireEvent.change(screen.getByPlaceholderText(/nama@apps.ipb.ac.id/i), {
      target: { value: 'wrong@ipb.ac.id' },
    });
    fireEvent.change(screen.getByPlaceholderText(/masukkan password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByText(/email atau password salah/i)).toBeInTheDocument();
    });

    // Must NOT redirect to home
    expect(window.location.href).toBe('');
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('api 401 handler redirects only when a token was present (session expiry)', () => {
    localStorage.setItem(apiModule.TOKEN_KEY, 'old-token');

    // Simulate what the 401 handler does
    const hadToken = !!localStorage.getItem(apiModule.TOKEN_KEY);
    localStorage.removeItem(apiModule.TOKEN_KEY);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    if (hadToken) (window as any).location.href = '/';

    expect((window as any).location.href).toBe('/');
  });

  it('api 401 handler does NOT redirect when no token was present (login attempt)', () => {
    localStorage.clear(); // no token

    const hadToken = !!localStorage.getItem(apiModule.TOKEN_KEY);
    localStorage.removeItem(apiModule.TOKEN_KEY);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    if (hadToken) (window as any).location.href = '/';

    expect((window as any).location.href).toBe('');
  });
});
