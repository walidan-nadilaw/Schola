import { vi } from 'vitest';
import * as apiModule from '@/app/utils/api';
import { fetchVerifiers } from '@/app/utils/users';

vi.mock('@/app/utils/api', async (importOriginal) => {
  const actual = await importOriginal<typeof apiModule>();
  return {
    ...actual,
    api: { ...actual.api, get: vi.fn() },
  };
});

const mockedGet = vi.mocked(apiModule.api.get);

const makeUser = (overrides: Partial<{ id: string; role: string; nama: string; email: string }>) => ({
  id: 'u1',
  role: 'mahasiswa',
  nama: 'Test User',
  email: 'test@ipb.ac.id',
  ...overrides,
});

describe('FE-NEW: fetchVerifiers excludes operators', () => {
  beforeEach(() => vi.clearAllMocks());

  it('excludes operators from results', async () => {
    mockedGet.mockResolvedValue([
      makeUser({ id: 'u1', role: 'mahasiswa' }),
      makeUser({ id: 'u2', role: 'operator' }),
      makeUser({ id: 'u3', role: 'dosen_pejabat' }),
    ]);
    const result = await fetchVerifiers();
    expect(result.map((u) => u.id)).not.toContain('u2');
    expect(result.map((u) => u.id)).toContain('u1');
    expect(result.map((u) => u.id)).toContain('u3');
  });

  it('does NOT filter by role=dosen_pejabat anymore', async () => {
    mockedGet.mockResolvedValue([]);
    await fetchVerifiers('test');
    const callArgs = mockedGet.mock.calls[0][1]?.params as Record<string, unknown>;
    expect(callArgs?.role).toBeUndefined();
    expect(callArgs?.search).toBe('test');
  });
});
