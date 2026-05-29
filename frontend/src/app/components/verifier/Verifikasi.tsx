import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Search, ArrowUpDown, FileText, Download, X } from 'lucide-react';
import { Submission, SubmissionStatus, mapBackendToSubmission } from '../../utils/submissions';
import { api } from '../../utils/api';

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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const response = await api.get<any>('/verifications');
      const data = response?.data || [];
      const mapped = Array.isArray(data) ? data.map((s: any) => {
        return new Submission({
          id: s.submission_id,
          jenisSurat: s.letter_type,
          keperluan: s.keperluan || 'Keperluan Akademik',
          tanggalPengajuan: s.created_at,
          status: SubmissionStatus.PENDING,
          submitterName: s.submitter_name,
          submitterNim: s.submitter_nim || '',
          formData: {},
          attachments: [],
          verifiers: [],
          role: s.verifier_role === 'verifier' ? 'verifier' : 'signer'
        });
      }) : [];
      setSubmissions(mapped);
    } catch (e) {
      console.error('Gagal mengambil daftar verifikasi:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  const handleOpenVerificationForm = (action: 'approve' | 'reject') => {
    setVerificationAction(action);
    setVerificationMessage('');
    setShowVerificationForm(true);
  };

  const handleSubmitVerification = async () => {
    if (!selectedSubmission || !verificationAction) return;

    const status = verificationAction === 'approve' ? 'approved' : 'rejected';
    setLoading(true);
    try {
      const response = await api.post<any>('/verifications/verify', {
        submission_id: selectedSubmission.id,
        action: status,
        comment: status === 'approved' ? verificationMessage : '',
        rejection_reason: status === 'rejected' ? verificationMessage : ''
      });
      alert(response?.message || response?.data?.message || `Pengajuan ${selectedSubmission.id} berhasil diproses!`);
      loadVerifications();
    } catch (e: any) {
      alert(`Gagal memproses verifikasi: ${e.message}`);
    } finally {
      setLoading(false);
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

  const handleViewDetail = async (submission: Submission) => {
    setLoading(true);
    try {
      const response = await api.get<any>(`/submissions/${encodeURIComponent(submission.id)}`);
      const full = response?.data || response;
      if (full) {
        setSelectedSubmission(mapBackendToSubmission(full));
        setShowDetailModal(true);
      } else {
        alert("Gagal mengambil detail pengajuan.");
      }
    } catch (e) {
      console.error('Gagal mengambil detail:', e);
      alert("Gagal mengambil detail pengajuan.");
    } finally {
      setLoading(false);
    }
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="animate-spin h-8 w-8 text-[#007bff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-500 font-medium">Memuat antrean verifikasi...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedSubmissions.map((submission, index) => (
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
                            setTimeout(() => handleOpenVerificationForm('approve'), 300);
                          }}
                          className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                            submission.role === 'verifier'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                          title={submission.role === 'verifier' ? "Setujui" : "Tanda Tangan & Setujui"}
                        >
                          {submission.role === 'verifier' ? "Setuju" : "Tanda Tangan"}
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
              setShowVerificationForm(false);
              setVerificationAction(null);
              setVerificationMessage('');
            }}
          ></div>

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              {/* Close Button X */}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSubmission(null);
                  setShowVerificationForm(false);
                  setVerificationAction(null);
                  setVerificationMessage('');
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Tutup"
              >
                <X size={20} />
              </button>
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

                  {selectedSubmission.formData && Object.keys(selectedSubmission.formData).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium text-gray-700 mb-2 border-b pb-1">Detail Isi Formulir</p>
                      {Object.entries(selectedSubmission.formData).map(([key, value]) => {
                        const isFileArray = Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && ('path' in value[0] || 'file_path' in value[0]);
                        
                        return (
                          <div key={key}>
                            <label className="text-xs font-semibold text-gray-500">{key}</label>
                            {isFileArray ? (
                              <div className="space-y-1 mt-0.5">
                                {(value as any[]).map((file, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const filePath = file.path || file.file_path;
                                      if (filePath) {
                                        const url = filePath.startsWith('http') ? filePath : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${filePath}`;
                                        window.open(url, '_blank');
                                      }
                                    }}
                                    className="flex items-center gap-1.5 text-[#007bff] hover:underline text-xs font-semibold"
                                  >
                                    <FileText size={14} />
                                    <span>{file.name || 'Dokumen'}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-gray-900">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

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

                  {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Dokumen Pendukung</p>
                      <div className="space-y-2">
                        {selectedSubmission.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <FileText className="text-[#007bff]" size={20} />
                              <div>
                                <p className="font-semibold text-sm text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{file.size}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (file.path) {
                                  const url = file.path.startsWith('http') ? file.path : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${file.path}`;
                                  window.open(url, '_blank');
                                } else {
                                  alert(`Mengunduh dokumen: ${file.name}`);
                                }
                              }}
                              className="p-1.5 text-[#007bff] hover:bg-blue-50 rounded transition-colors"
                              title="Buka / Download Dokumen"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-gray-700 mb-2">Dokumen Pendukung</p>
                      <p className="text-sm text-gray-500">Tidak ada dokumen pendukung yang dilampirkan</p>
                    </div>
                  )}

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
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white ${
                              verificationAction === 'reject'
                                ? 'bg-red-600 hover:bg-red-700'
                                : selectedSubmission.role === 'verifier'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            <CheckCircle size={20} />
                            {verificationAction === 'reject'
                              ? 'Kirim Alasan Penolakan'
                              : selectedSubmission.role === 'verifier'
                              ? 'Kirim Verifikasi'
                              : 'Kirim & Bubuhkan E-Signature'}
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
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors text-white ${
                              selectedSubmission.role === 'verifier'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            <CheckCircle size={20} />
                            {selectedSubmission.role === 'verifier' ? 'Setujui' : 'Tanda Tangan & Setujui'}
                          </button>
                          <button
                            onClick={() => handleOpenVerificationForm('reject')}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
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
