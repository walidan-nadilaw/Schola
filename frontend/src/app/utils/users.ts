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

// Dynamic verifier fetching from backend database
export const fetchVerifiers = async (): Promise<User[]> => {
  try {
    const data = await api.get<any[]>('/auth/verifiers');
    return data.map((u) => new User({
      id: u.id,
      name: u.name,
      role: u.role,
      department: u.department || u.position || 'IPB University',
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
