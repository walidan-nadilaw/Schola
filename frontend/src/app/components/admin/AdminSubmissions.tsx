import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileText, Eye, Trash2, ShieldAlert, Search } from 'lucide-react';
import { fetchAllSubmissions, deleteSubmissionDraft, Submission, SubmissionStatus } from '../../utils/submissions';

interface AdminSubmissionsProps {
  onViewDetail: (id: string) => void;
}

export default function AdminSubmissions({ onViewDetail }: AdminSubmissionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const list = await fetchAllSubmissions(undefined, false);
      setSubmissions(list);
    } catch (e) {
      console.error('Gagal mengambil data pengajuan:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengajuan ${id}?`)) {
      try {
        await deleteSubmissionDraft(id);
        toast.success('Pengajuan berhasil dihapus dari sistem!');
        loadSubmissions();
      } catch (e: any) {
        toast.error(`Gagal menghapus pengajuan: ${e.message}`);
      }
    }
  };

  const filtered = submissions.filter((sub) => {
    const matchesSearch =
      sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.submitterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.jenisSurat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manajemen Pengajuan</h1>
          <p className="text-gray-600">Audit, manipulasi, dan lakukan moderasi terhadap seluruh pengajuan surat mahasiswa di IPB</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari ID, Mahasiswa, atau Surat..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007bff]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007bff] bg-white text-sm"
          >
            <option value="all">Semua Status</option>
            <option value={SubmissionStatus.DRAFT}>{SubmissionStatus.DRAFT}</option>
            <option value={SubmissionStatus.PENDING}>{SubmissionStatus.PENDING}</option>
            <option value={SubmissionStatus.APPROVED}>{SubmissionStatus.APPROVED}</option>
            <option value={SubmissionStatus.REJECTED}>{SubmissionStatus.REJECTED}</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <th className="p-4">ID</th>
                <th className="p-4">Mahasiswa</th>
                <th className="p-4">Jenis Surat</th>
                <th className="p-4">Tanggal Pengajuan</th>
                <th className="p-4">Status Saat Ini</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{sub.id}</td>
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-gray-800">{sub.submitterName}</p>
                      <p className="text-xs text-gray-500">{sub.submitterNim}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1">
                      <FileText size={16} className="text-[#007bff]" />
                      {sub.jenisSurat}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(sub.tanggalPengajuan).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${sub.getStatusColorClass()}`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onViewDetail(sub.id)}
                        className="p-2 text-[#007bff] hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Pengajuan"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500">
                    <ShieldAlert className="mx-auto mb-3 text-gray-400" size={40} />
                    <p>Tidak ada pengajuan ditemukan yang cocok dengan kriteria filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
