// User types and mock data for verifier selection

export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
}

export interface SelectedVerifier extends User {
  order?: number;
  verifierRole?: 'verifikator' | 'penandatangan';
}

// Mock users data (in real app, this would come from API)
export const mockUsers: User[] = [
  {
    id: 'U001',
    name: 'Dr. Ahmad Santoso',
    role: 'Dosen',
    department: 'Fakultas Pertanian',
    email: 'ahmad.santoso@ipb.ac.id'
  },
  {
    id: 'U002',
    name: 'Dr. Siti Rahayu',
    role: 'Kepala Departemen',
    department: 'Departemen Agronomi',
    email: 'siti.rahayu@ipb.ac.id'
  },
  {
    id: 'U003',
    name: 'Prof. Budi Wijaya',
    role: 'Dekan',
    department: 'Fakultas Pertanian',
    email: 'budi.wijaya@ipb.ac.id'
  },
  {
    id: 'U004',
    name: 'Rina Kusuma, S.Si., M.Si.',
    role: 'Staff Administrasi',
    department: 'Bagian Akademik',
    email: 'rina.kusuma@ipb.ac.id'
  },
  {
    id: 'U005',
    name: 'Dr. Eko Prasetyo',
    role: 'Dosen',
    department: 'Fakultas Ekonomi',
    email: 'eko.prasetyo@ipb.ac.id'
  },
  {
    id: 'U006',
    name: 'Prof. Dr. Dewi Lestari',
    role: 'Wakil Dekan',
    department: 'Fakultas MIPA',
    email: 'dewi.lestari@ipb.ac.id'
  },
  {
    id: 'U007',
    name: 'Agus Suryanto, M.Kom.',
    role: 'Kepala Bagian',
    department: 'Bagian Kemahasiswaan',
    email: 'agus.suryanto@ipb.ac.id'
  },
  {
    id: 'U008',
    name: 'Dr. Maya Sari',
    role: 'Dosen',
    department: 'Fakultas Peternakan',
    email: 'maya.sari@ipb.ac.id'
  },
  {
    id: 'U009',
    name: 'Hendra Gunawan, S.E., M.M.',
    role: 'Staff Administrasi',
    department: 'Rektorat',
    email: 'hendra.gunawan@ipb.ac.id'
  },
  {
    id: 'U010',
    name: 'Prof. Dr. Sri Wahyuni',
    role: 'Guru Besar',
    department: 'Fakultas Kehutanan',
    email: 'sri.wahyuni@ipb.ac.id'
  }
];

// Search function
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

// Get user by ID
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find((user) => user.id === id);
};
