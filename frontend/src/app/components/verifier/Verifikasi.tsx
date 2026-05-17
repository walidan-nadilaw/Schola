import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Search, ArrowUpDown } from 'lucide-react';
import { Submission, SubmissionStatus, getAllSubmissions, updateSubmissionInMock } from '../../utils/submissions';

type SortableColumn = 'judul' | 'tanggalSubmit' | 'tanggalVerifikasi' | 'keterangan';

export default function Verifikasi() {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject' | null>(null);

  // Load submissions from the centralized OOP database service
  const submissions: Submission[] = getAllSubmissions();

  const handleOpenVerificationForm = (action: 'approve' | 'reject') => {
    setVerificationAction(action);
    setVerificationMessage('');
    setShowVerificationForm(true);
  };

  const handleSubmitVerification = () => {
    if (!selectedSubmission) return;

    if (verificationAction === 'approve') {
      updateSubmissionInMock(selectedSubmission.id, {
        status: SubmissionStatus.APPROVED,
        tanggalVerifikasi: new Date().toISOString().split('T')[0],
        verifierName: 'Dr. Ahmad Santoso' // Mocking logged-in verifier
      });
      alert(`Pengajuan ${selectedSubmission.id} berhasil diverifikasi!\nPesan: ${verificationMessage || '(Tanpa pesan)'}`);
    } else {
      updateSubmissionInMock(selectedSubmission.id, {
        status: SubmissionStatus.REJECTED,
        keteranganVerifikator: verificationMessage
      });
      alert(`Pengajuan ${selectedSubmission.id} ditolak.\nAlasan: ${verificationMessage || '(Tanpa alasan)'}`);
    }

    setShowVerificationForm(false);
    setShowDetailModal(false);
    setSelectedSubmission(null);
    setVerificationMessage('');
    setVerificationAction(null);
  };

  const handleCancelVerification = () => {
    setShowVerificationForm(false);
    setVerificationMessage('');
    setVerificationAction(null);
  };

  const handleViewDetail = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  };

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const query = searchQuery.toLowerCase();
    const verifierRoleText = sub.role === 'verifier' ? 'verifikator' : 'penandatangan';
    return (
      sub.keperluan.toLowerCase().includes(query) ||
      sub.jenisSurat.toLowerCase().includes(query) ||
      sub.id.toLowerCase().includes(query) ||
      sub.submitterName.toLowerCase().includes(query) ||
      sub.submitterNim.toLowerCase().includes(query) ||
      verifierRoleText.toLowerCase().includes(query)
    );
  });

  const sortedSubmissions = sortColumn
    ? Submission.sortByColumn(filteredSubmissions, sortColumn, sortDirection)
    : filteredSubmissions;

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <h1 className="text-3xl font-bold mb-2">Verifikasi Pengajuan</h1>
      <p className="text-gray-600 mb-8">Daftar pengajuan surat mahasiswa</p>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan judul, jenis surat, nama, atau keterangan..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">No</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                  <button
                    onClick={() => handleSort('judul')}
                    className="flex items-center gap-2 hover:text-[#007bff]"
                  >
                    Judul Surat
                    <ArrowUpDown size={16} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                  <button
                    onClick={() => handleSort('tanggalSubmit')}
                    className="flex items-center gap-2 hover:text-[#007bff]"
                  >
                    Tanggal Pengajuan
                    <ArrowUpDown size={16} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                  <button
                    onClick={() => handleSort('tanggalVerifikasi')}
                    className="flex items-center gap-2 hover:text-[#007bff]"
                  >
                    Tanggal Verifikasi
                    <ArrowUpDown size={16} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                  <button
                    onClick={() => handleSort('keterangan')}
                    className="flex items-center gap-2 hover:text-[#007bff]"
                  >
                    Keterangan
                    <ArrowUpDown size={16} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedSubmissions.map((submission, index) => (
                <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>

                  {/* Letter Title Column */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{submission.keperluan}</p>
                      <p className="text-sm text-gray-500">{submission.jenisSurat}</p>
                    </div>
                  </td>

                  {/* Submission Date Column */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {submission.getFormattedDate(submission.tanggalPengajuan)}
                      </p>
                      <p className="text-xs text-gray-500">oleh {submission.submitterName}</p>
                      <p className="text-xs text-gray-500">{submission.submitterNim}</p>
                    </div>
                  </td>

                  {/* Verification Date Column */}
                  <td className="px-6 py-4">
                    {!submission.isPending() && submission.tanggalVerifikasi ? (
                      <div>
                        <p className="text-sm font-medium text-green-700">
                          {submission.getFormattedDate(submission.tanggalVerifikasi)}
                        </p>
                        <p className="text-xs text-gray-500">oleh {submission.verifierName}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Menunggu
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Keterangan Column */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      submission.role === 'verifier'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {submission.role === 'verifier' ? 'Verifikator' : 'Penandatangan'}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(submission)}
                        className="p-2 text-[#007bff] hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>
                      {submission.isPending() && (
                        <button
                          onClick={() => {
                            handleViewDetail(submission);
                            setTimeout(() => handleOpenVerificationForm('approve'), 100);
                          }}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          title="Setujui"
                        >
                          Setuju
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedSubmissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada pengajuan yang ditemukan</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowDetailModal(false);
              setSelectedSubmission(null);
            }}
          ></div>

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Detail Pengajuan</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedSubmission.isFullyApproved()
                      ? 'bg-green-100 text-green-700'
                      : selectedSubmission.status === SubmissionStatus.REJECTED
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedSubmission.isFullyApproved() ? 'Terverifikasi' : selectedSubmission.status === SubmissionStatus.REJECTED ? 'Ditolak' : 'Menunggu Verifikasi'}
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID Pengajuan</label>
                      <p className="mt-1 font-medium">{selectedSubmission.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tanggal Pengajuan</label>
                      <p className="mt-1 font-medium">
                        {selectedSubmission.getFormattedDate(selectedSubmission.tanggalPengajuan)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nama Mahasiswa</label>
                      <p className="mt-1 font-medium">{selectedSubmission.submitterName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">NIM</label>
                      <p className="mt-1 font-medium">{selectedSubmission.submitterNim}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Jenis Surat</label>
                    <p className="mt-1 font-medium">{selectedSubmission.jenisSurat}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Keperluan</label>
                    <p className="mt-1 font-medium">{selectedSubmission.keperluan}</p>
                  </div>

                  {selectedSubmission.keteranganVerifikator && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Keterangan Verifikator</label>
                      <p className="mt-1 text-gray-700">{selectedSubmission.keteranganVerifikator}</p>
                    </div>
                  )}

                  {!selectedSubmission.isPending() && selectedSubmission.tanggalVerifikasi && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-2">Informasi Verifikasi</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-green-700">Tanggal Verifikasi</p>
                          <p className="text-sm font-medium text-green-900">
                            {selectedSubmission.getFormattedDate(selectedSubmission.tanggalVerifikasi)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700">Diverifikasi oleh</p>
                          <p className="text-sm font-medium text-green-900">{selectedSubmission.verifierName}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Keterangan Peran</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedSubmission.role === 'verifier'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {selectedSubmission.role === 'verifier' ? 'Verifikator' : 'Penandatangan'}
                      </span>
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Dokumen Pendukung</p>
                    <button className="flex items-center gap-2 text-[#007bff] hover:underline text-sm">
                      <Eye size={16} />
                      <span>Lihat Dokumen</span>
                    </button>
                  </div>

                  {/* Verification Form */}
                  {showVerificationForm && selectedSubmission.isPending() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pesan untuk Pemohon {verificationAction === 'reject' && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        value={verificationMessage}
                        onChange={(e) => setVerificationMessage(e.target.value)}
                        placeholder={verificationAction === 'approve' ? 'Tambahkan catatan (opsional)...' : 'Masukkan alasan penolakan...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
                        rows={4}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    {selectedSubmission.isPending() ? (
                      showVerificationForm ? (
                        <>
                          <button
                            onClick={handleSubmitVerification}
                            disabled={verificationAction === 'reject' && !verificationMessage.trim()}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#007bff] text-white py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={20} />
                            Kirim
                          </button>
                          <button
                            onClick={handleCancelVerification}
                            className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenVerificationForm('approve')}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle size={20} />
                            Setuju
                          </button>
                          <button
                            onClick={() => handleOpenVerificationForm('reject')}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
                          >
                            <XCircle size={20} />
                            Tolak
                          </button>
                        </>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setSelectedSubmission(null);
                        }}
                        className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                      >
                        Tutup
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
