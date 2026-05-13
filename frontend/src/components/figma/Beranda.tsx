import { Eye, FileText, Clock, MessageCircle } from 'lucide-react';

interface BerandaProps {
  onSectionChange?: (section: string) => void;
  onViewSubmissionDetail?: (submissionId: string) => void;
}

interface PendingSubmission {
  id: string;
  jenisSurat: string;
  keperluan: string;
  tanggalPengajuan: string;
  submitterName: string;
  submitterNim: string;
}

interface RecentSubmission {
  id: string;
  jenisSurat: string;
  keperluan: string;
  tanggalPengajuan: string;
  status: 'Draft' | 'Menunggu Verifikasi' | 'Disetujui' | 'Ditolak';
}

export default function Beranda({ onSectionChange, onViewSubmissionDetail }: BerandaProps) {
  const pendingVerifications: PendingSubmission[] = [
    {
      id: 'SUB-2026-002',
      jenisSurat: 'Surat Izin Penelitian',
      keperluan: 'Penelitian Tugas Akhir di PT Indofood',
      tanggalPengajuan: '2026-04-27',
      submitterName: 'Naufal Akmal',
      submitterNim: 'G6401231065'
    },
    {
      id: 'SUB-2026-003',
      jenisSurat: 'Surat Cuti Akademik',
      keperluan: 'Cuti karena alasan kesehatan',
      tanggalPengajuan: '2026-04-26',
      submitterName: 'Naufal Akmal',
      submitterNim: 'G6401231065'
    },
    {
      id: 'SUB-2026-007',
      jenisSurat: 'Surat Keterangan Aktif',
      keperluan: 'Beasiswa S2 Luar Negeri',
      tanggalPengajuan: '2026-04-25',
      submitterName: 'Ahmad Rizki',
      submitterNim: 'G6401231001'
    },
  ];

  const recentSubmissions: RecentSubmission[] = [
    {
      id: 'SUB-2026-001',
      jenisSurat: 'Surat Keterangan Aktif',
      keperluan: 'Beasiswa LPDP',
      tanggalPengajuan: '2026-04-28',
      status: 'Disetujui'
    },
    {
      id: 'SUB-2026-002',
      jenisSurat: 'Surat Izin Penelitian',
      keperluan: 'Penelitian Tugas Akhir di PT Indofood',
      tanggalPengajuan: '2026-04-27',
      status: 'Menunggu Verifikasi'
    },
    {
      id: 'SUB-2026-003',
      jenisSurat: 'Surat Cuti Akademik',
      keperluan: 'Cuti karena alasan kesehatan',
      tanggalPengajuan: '2026-04-26',
      status: 'Menunggu Verifikasi'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-green-100 text-green-700';
      case 'Ditolak':
        return 'bg-red-100 text-red-700';
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <h1 className="text-3xl font-bold mb-2">Selamat Datang di Schola</h1>
      <p className="text-gray-600 mb-8">IPB Academic Help Center - Dashboard</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => onSectionChange?.('ajuan')}
          className="bg-[#007bff] text-white p-6 rounded-lg hover:bg-[#0056b3] transition-colors text-left"
        >
          <FileText className="mb-3" size={32} />
          <p className="font-bold text-lg">Ajukan Surat Baru</p>
          <p className="text-sm opacity-90 mt-1">Buat pengajuan surat akademik</p>
        </button>
        <button
          onClick={() => onSectionChange?.('diajukan')}
          className="bg-white text-gray-700 p-6 rounded-lg border-2 border-gray-200 hover:border-[#007bff] transition-colors text-left"
        >
          <Clock className="mb-3" size={32} />
          <p className="font-bold text-lg">Riwayat Pengajuan</p>
          <p className="text-sm text-gray-600 mt-1">Lihat status pengajuan surat</p>
        </button>
        <button
          onClick={() => onSectionChange?.('chatbot')}
          className="bg-white text-gray-700 p-6 rounded-lg border-2 border-gray-200 hover:border-[#007bff] transition-colors text-left"
        >
          <MessageCircle className="mb-3" size={32} />
          <p className="font-bold text-lg">Bantuan</p>
          <p className="text-sm text-gray-600 mt-1">Chatbot dan panduan</p>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pending Verification Preview */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Menunggu Verifikasi</h2>
              <p className="text-xs text-gray-600 mt-0.5">Pengajuan yang perlu diverifikasi</p>
            </div>
            <button
              onClick={() => onSectionChange?.('verifikasi')}
              className="text-sm text-[#007bff] hover:underline font-medium"
            >
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Judul Surat</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingVerifications.slice(0, 3).map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{submission.keperluan}</p>
                        <p className="text-xs text-gray-500">{submission.jenisSurat}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">
                        {new Date(submission.tanggalPengajuan).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewSubmissionDetail?.(submission.id)}
                        className="p-1.5 text-[#007bff] hover:bg-blue-50 rounded transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pendingVerifications.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Tidak ada pengajuan yang menunggu verifikasi</p>
            </div>
          )}
        </div>

        {/* Recent Submissions Preview */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Riwayat Pengajuan Terbaru</h2>
              <p className="text-xs text-gray-600 mt-0.5">Pengajuan surat terkini</p>
            </div>
            <button
              onClick={() => onSectionChange?.('diajukan')}
              className="text-sm text-[#007bff] hover:underline font-medium"
            >
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Judul Surat</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentSubmissions.slice(0, 3).map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onViewSubmissionDetail?.(submission.id)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{submission.keperluan}</p>
                        <p className="text-xs text-gray-500">{submission.jenisSurat}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">
                        {new Date(submission.tanggalPengajuan).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentSubmissions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Belum ada pengajuan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
