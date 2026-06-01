import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, AlertCircle, Shield, User as UserIcon } from 'lucide-react';
import { api } from '../../utils/api';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  nim?: string;
  fakultas?: string;
  program?: string;
  nip?: string;
  position?: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'mahasiswa',
    department: '',
    nim: '',
    fakultas: '',
    program: '',
    nip: '',
    position: '',
  });

  const roles = [
    { value: 'mahasiswa', label: 'Mahasiswa' },
    { value: 'dosen', label: 'Dosen' },
    { value: 'pejabat', label: 'Pejabat' },
    { value: 'staff', label: 'Staf Akademik' },
    { value: 'admin', label: 'Administrator' },
  ];

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const queryParams: Record<string, string> = {};
      if (search) queryParams.search = search;
      if (roleFilter) queryParams.role = roleFilter;
      
      const response = await api.get<any>('/users/', { params: queryParams });
      const rawUsers = response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
      const mappedUsers = Array.isArray(rawUsers) ? rawUsers.map((u: any) => ({
        id: u.id,
        name: u.nama || u.name || '',
        email: u.email,
        role: mapBackendRoleToFrontend(u.role || '', u.position || u.jabatan || ''),
        department: u.departemen || u.department || '',
        nim: u.nim,
        fakultas: u.fakultas,
        program: u.program || u.program_studi || '',
        nip: u.nip,
        position: u.position || u.jabatan || '',
      })) : [];
      setUsers(mappedUsers);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat daftar pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'mahasiswa',
      department: '',
      nim: '',
      fakultas: '',
      program: '',
      nip: '',
      position: '',
    });
    setError('');
    setSuccess('');
    setShowAddModal(true);
  };

  const mapBackendRoleToFrontend = (role: string, position?: string): string => {
    const r = role.toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'operator') return 'staff';
    if (r === 'dosen_pejabat') {
      const pos = (position || '').toLowerCase();
      if (pos.includes('pejabat') || pos.includes('dekan') || pos.includes('rektor') || pos.includes('ketua') || pos.includes('kaprodi') || pos.includes('kajur') || pos.includes('wakil')) {
        return 'pejabat';
      }
      return 'dosen';
    }
    return 'mahasiswa';
  };

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // blank password means no change or handled separately
      role: user.role,
      department: user.department || '',
      nim: user.nim || '',
      fakultas: user.fakultas || '',
      program: user.program || '',
      nip: user.nip || '',
      position: user.position || '',
    });
    setError('');
    setSuccess('');
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const mappedRole = formData.role === 'admin' || formData.role === 'staff' ? 'operator' : (formData.role === 'dosen' || formData.role === 'pejabat' ? 'dosen_pejabat' : 'mahasiswa');
      const payload: any = {
        nama: formData.name,
        email: formData.email,
        password: formData.password,
        role: mappedRole,
        departemen: formData.department || undefined,
      };

      if (formData.role === 'mahasiswa') {
        payload.nim = formData.nim || undefined;
        payload.fakultas = formData.fakultas || undefined;
        payload.program = formData.program || undefined;
      } else if (formData.role === 'dosen' || formData.role === 'pejabat' || formData.role === 'staff') {
        payload.nip = formData.nip || undefined;
        payload.position = formData.position || undefined;
      }

      await api.post('/users/', payload);
      setSuccess('Pengguna baru berhasil ditambahkan!');
      setShowAddModal(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Gagal menambahkan pengguna baru.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setError('');
      const mappedRole = formData.role === 'admin' || formData.role === 'staff' ? 'operator' : (formData.role === 'dosen' || formData.role === 'pejabat' ? 'dosen_pejabat' : 'mahasiswa');
      const payload: any = {
        nama: formData.name,
        role: mappedRole,
        departemen: formData.department || null,
      };

      if (formData.role === 'mahasiswa') {
        payload.nim = formData.nim || null;
        payload.fakultas = formData.fakultas || null;
        payload.program = formData.program || null;
        payload.nip = null;
        payload.position = null;
      } else if (formData.role === 'dosen' || formData.role === 'pejabat' || formData.role === 'staff') {
        payload.nip = formData.nip || null;
        payload.position = formData.position || null;
        payload.nim = null;
        payload.fakultas = null;
        payload.program = null;
      } else {
        payload.nim = null;
        payload.fakultas = null;
        payload.program = null;
        payload.nip = null;
        payload.position = null;
      }

      await api.put(`/users/${selectedUser.id}`, payload);
      setSuccess('Informasi pengguna berhasil diperbarui!');
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Gagal memperbarui informasi pengguna.');
    }
  };

  const handleDelete = async (user: UserItem) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.name}?`)) return;
    try {
      setError('');
      await api.delete(`/users/${user.id}`);
      setSuccess('Pengguna berhasil dihapus!');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setError('Gagal menghapus pengguna.');
    }
  };

  const getRoleBadge = (role: string) => {
    const styleMap: Record<string, string> = {
      admin: 'bg-red-50 text-red-700 border-red-200',
      mahasiswa: 'bg-blue-50 text-blue-700 border-blue-200',
      dosen: 'bg-purple-50 text-purple-700 border-purple-200',
      pejabat: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      staff: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    const labelMap: Record<string, string> = {
      admin: 'Administrator',
      mahasiswa: 'Mahasiswa',
      dosen: 'Dosen',
      pejabat: 'Pejabat',
      staff: 'Staf Akademik',
    };
    const roleKey = role.toLowerCase();
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styleMap[roleKey] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {labelMap[roleKey] || role}
      </span>
    );
  };

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">User (Admin POV)</h1>
          <p className="text-gray-600">Lakukan pendaftaran, pembaruan, dan manajemen akses seluruh pengguna sistem Schola</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#007bff] hover:bg-[#0056b3] text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Tambah Pengguna
        </button>
      </div>

      {/* Alert Banner */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-6 flex items-center justify-between">
          <p className="font-semibold">{success}</p>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236c757d%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat"
          >
            <option value="">Semua Peran</option>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-500 font-medium">Memuat data pengguna...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-500 font-medium">
            <UserIcon size={48} className="mx-auto text-gray-300 mb-4" />
            Tidak ada pengguna ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Peran</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Detail Informasi</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-55/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${user.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}>
                           {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {user.role === 'mahasiswa' && (
                        <div>
                          <p><span className="font-semibold text-gray-700">NIM:</span> {user.nim || '-'}</p>
                          <p><span className="font-semibold text-gray-700">Prodi:</span> {user.program || '-'}</p>
                          <p><span className="font-semibold text-gray-700">Fakultas:</span> {user.fakultas || '-'}</p>
                        </div>
                      )}
                      {(user.role === 'dosen' || user.role === 'pejabat' || user.role === 'staff') && (
                        <div>
                          <p><span className="font-semibold text-gray-700">NIP:</span> {user.nip || '-'}</p>
                          <p><span className="font-semibold text-gray-700">Jabatan:</span> {user.position || '-'}</p>
                        </div>
                      )}
                      {user.role === 'admin' && (
                        <p className="flex items-center gap-1 text-red-600 font-semibold"><Shield size={14} /> Hak Akses Sistem Penuh</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#007bff] transition-colors"
                          title="Edit Pengguna"
                        >
                          <Edit size={16} />
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                            title="Hapus Pengguna"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in border border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">Tambah Pengguna Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Peran (Role)</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                    placeholder="budi@apps.ipb.ac.id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                    placeholder="********"
                  />
                </div>
              </div>

              {/* Mahasiswa-specific fields */}
              {formData.role === 'mahasiswa' && (
                <div className="space-y-4 border-t border-gray-150 pt-4">
                  <h4 className="text-sm font-bold text-gray-800">Atribut Mahasiswa</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">NIM</label>
                      <input
                        type="text"
                        name="nim"
                        required
                        value={formData.nim}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#007bff] text-xs"
                        placeholder="G64180001"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Program Studi</label>
                      <input
                        type="text"
                        name="program"
                        required
                        value={formData.program}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#007bff] text-xs"
                        placeholder="S1 Ilmu Komputer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fakultas</label>
                      <input
                        type="text"
                        name="fakultas"
                        required
                        value={formData.fakultas}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#007bff] text-xs"
                        placeholder="FMIPA"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dosen/Staff/Pejabat specific fields */}
              {(formData.role === 'dosen' || formData.role === 'pejabat' || formData.role === 'staff') && (
                <div className="space-y-4 border-t border-gray-150 pt-4">
                  <h4 className="text-sm font-bold text-gray-800">Atribut Kepegawaian</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">NIP</label>
                      <input
                        type="text"
                        name="nip"
                        required
                        value={formData.nip}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                        placeholder="198503122010121001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jabatan</label>
                      <input
                        type="text"
                        name="position"
                        required
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                        placeholder="Dosen Pembimbing"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#007bff] hover:bg-[#0056b3] text-white transition-colors text-sm font-bold shadow-md"
                >
                  Tambah Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit Pengguna: {selectedUser.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Peran (Role)</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password Baru (Opsional)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                    placeholder="Kosongkan jika tidak diubah"
                  />
                </div>
              </div>

              {/* Mahasiswa-specific fields */}
              {formData.role === 'mahasiswa' && (
                <div className="space-y-4 border-t border-gray-150 pt-4">
                  <h4 className="text-sm font-bold text-gray-800">Atribut Mahasiswa</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">NIM</label>
                      <input
                        type="text"
                        name="nim"
                        required
                        value={formData.nim}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#007bff] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Program Studi</label>
                      <input
                        type="text"
                        name="program"
                        required
                        value={formData.program}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#007bff] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fakultas</label>
                      <input
                        type="text"
                        name="fakultas"
                        required
                        value={formData.fakultas}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#007bff] text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dosen/Staff/Pejabat specific fields */}
              {(formData.role === 'dosen' || formData.role === 'pejabat' || formData.role === 'staff') && (
                <div className="space-y-4 border-t border-gray-150 pt-4">
                  <h4 className="text-sm font-bold text-gray-800">Atribut Kepegawaian</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">NIP</label>
                      <input
                        type="text"
                        name="nip"
                        required
                        value={formData.nip}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jabatan</label>
                      <input
                        type="text"
                        name="position"
                        required
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#007bff] text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#007bff] hover:bg-[#0056b3] text-white transition-colors text-sm font-bold shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
