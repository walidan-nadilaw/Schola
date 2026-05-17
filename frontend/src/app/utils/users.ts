// User types, OOP Classes, and mock data for verifier selection

export class User {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;

  constructor(data: { id: string; name: string; role: string; department: string; email: string }) {
    this.id = data.id;
    this.name = data.name;
    this.role = data.role;
    this.department = data.department;
    this.email = data.email;
  }

  // Get Initials for profile avatar
  getInitials(): string {
    return this.name
      .split(' ')
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
    department: string;
    email: string;
    order?: number;
    verifierRole?: 'verifikator' | 'penandatangan';
  }) {
    super(data);
    this.order = data.order;
    this.verifierRole = data.verifierRole;
  }
}

// Mock users data instantiated as OOP Classes
export const mockUsers: User[] = [
  new User({
    id: 'U001',
    name: 'Dr. Ahmad Santoso',
    role: 'Dosen',
    department: 'Fakultas Pertanian',
    email: 'ahmad.santoso@ipb.ac.id'
  }),
  new User({
    id: 'U002',
    name: 'Dr. Siti Rahayu',
    role: 'Kepala Departemen',
    department: 'Departemen Agronomi',
    email: 'siti.rahayu@ipb.ac.id'
  }),
  new User({
    id: 'U003',
    name: 'Prof. Budi Wijaya',
    role: 'Dekan',
    department: 'Fakultas Pertanian',
    email: 'budi.wijaya@ipb.ac.id'
  }),
  new User({
    id: 'U004',
    name: 'Rina Kusuma, S.Si., M.Si.',
    role: 'Staff Administrasi',
    department: 'Bagian Akademik',
    email: 'rina.kusuma@ipb.ac.id'
  }),
  new User({
    id: 'U005',
    name: 'Dr. Eko Prasetyo',
    role: 'Dosen',
    department: 'Fakultas Ekonomi',
    email: 'eko.prasetyo@ipb.ac.id'
  }),
  new User({
    id: 'U006',
    name: 'Prof. Dr. Dewi Lestari',
    role: 'Wakil Dekan',
    department: 'Fakultas MIPA',
    email: 'dewi.lestari@ipb.ac.id'
  }),
  new User({
    id: 'U007',
    name: 'Agus Suryanto, M.Kom.',
    role: 'Kepala Bagian',
    department: 'Bagian Kemahasiswaan',
    email: 'agus.suryanto@ipb.ac.id'
  }),
  new User({
    id: 'U008',
    name: 'Dr. Maya Sari',
    role: 'Dosen',
    department: 'Fakultas Peternakan',
    email: 'maya.sari@ipb.ac.id'
  }),
  new User({
    id: 'U009',
    name: 'Hendra Gunawan, S.E., M.M.',
    role: 'Staff Administrasi',
    department: 'Rektorat',
    email: 'hendra.gunawan@ipb.ac.id'
  }),
  new User({
    id: 'U010',
    name: 'Prof. Dr. Sri Wahyuni',
    role: 'Guru Besar',
    department: 'Fakultas Kehutanan',
    email: 'sri.wahyuni@ipb.ac.id'
  })
];

// Search function returning class instances
export const searchUsers = (query: string): User[] => {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  return mockUsers.filter(
    (user) =>
      user.id.toLowerCase().includes(lowerQuery) ||
      user.name.toLowerCase().includes(lowerQuery) ||
      user.department.toLowerCase().includes(lowerQuery) ||
      user.role.toLowerCase().includes(lowerQuery)
  );
};

// Get user by ID returning class instance
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find((user) => user.id === id);
};
