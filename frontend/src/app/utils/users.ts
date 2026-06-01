import { api } from './api';

export class User {
  id: string;
  name: string;
  role: string;
  department?: string;
  email: string;
  nim?: string;
  fakultas?: string;
  program?: string;
  nip?: string;
  position?: string;

  constructor(data: {
    id: string;
    name: string;
    role: string;
    department?: string;
    email: string;
    nim?: string;
    fakultas?: string;
    program?: string;
    nip?: string;
    position?: string;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.role = data.role;
    this.department = data.department;
    this.email = data.email;
    this.nim = data.nim;
    this.fakultas = data.fakultas;
    this.program = data.program;
    this.nip = data.nip;
    this.position = data.position;
  }

  // Get Initials for profile avatar
  getInitials(): string {
    if (!this.name) return 'M';
    return this.name
      .split(' ')
      .filter(n => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

export class SelectedVerifier extends User {
  order?: number;
  verifierRole?: 'verifikator' | 'penandatangan';

  constructor(data: {
    id: string;
    name: string;
    role: string;
    department?: string;
    email: string;
    nim?: string;
    fakultas?: string;
    program?: string;
    nip?: string;
    position?: string;
    order?: number;
    verifierRole?: 'verifikator' | 'penandatangan';
  }) {
    super(data);
    this.order = data.order;
    this.verifierRole = data.verifierRole;
  }
}

// Fetch eligible verifiers: all users except operators.
// Accepts an optional search string to use server-side search (avoids paginating all users).
export const fetchVerifiers = async (search?: string): Promise<User[]> => {
  try {
    const params: Record<string, string | number> = { limit: 200 };
    if (search?.trim()) params.search = search.trim();
    const res = await api.get<any>('/users/', { params });
    const resData = res.data?.data || res.data || res;
    const data = Array.isArray(resData) ? resData : [];
    return data
      .filter((u: any) => u.role !== 'operator')
      .map((u: any) => new User({
        id: u.id,
        name: u.nama || u.name || u.email.split('@')[0],
        role: u.role,
        department: u.departemen || u.department || u.position || 'IPB University',
        email: u.email,
        nim: u.nim,
        fakultas: u.fakultas,
        program: u.program,
        nip: u.nip,
        position: u.position
      }));
  } catch (e) {
    console.error('Gagal mengambil daftar verifikator:', e);
    return [];
  }
};
