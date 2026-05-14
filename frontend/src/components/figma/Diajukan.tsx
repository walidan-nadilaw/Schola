import { useState } from 'react';
import { Search, Download, Eye, Edit, FileText, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface Submission {
  id: string;
  jenisSurat: string;
  keperluan: string;
  tanggalPengajuan: string;
  tanggalVerifikasi?: string;
  verifierName?: string;
  status: 'Draft' | 'Menunggu Verifikasi' | 'Disetujui' | 'Ditolak';
  keteranganVerifikator?: string;
  submitterName: string;
  submitterNim: string;
}

interface DiajukanProps {
  onNewSubmission?: () => void;
  onViewDetail?: (submissionId: string) => void;
  onEdit?: (submissionId: string) => void;
}

export default function Diajukan({ onNewSubmission, onViewDetail, onEdit }: DiajukanProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const submissions: Submission[] = [
    {
      id: 'SUB-2026-001',
      jenisSurat: 'Surat Keterangan Aktif',
      keperluan: 'Beasiswa LPDP',
      tanggalPengajuan: '2026-04-28',
      tanggalVerifikasi: '2026-04-29',
      verifierName: 'Dr. Ahmad Santoso',
      status: 'Disetujui',
      keteranganVerifikator: 'Dokumen lengkap dan memenuhi syarat',
      submitterName: 'Naufal Akmal',
      submitterNim: 'G6401231065'
    },
    {
      id: 'SUB-2026-002',
      jenisSurat: 'Surat Izin Penelitian',
      keperluan: 'Penelitian Tugas Akhir di PT Indofood',
      tanggalPengajuan: '2026-04-27',
      status: 'Menunggu Verifikasi',
      submitterName: 'Naufal Akmal',
      submitterNim: 'G6401231065'
    },
    {
      id: 'SUB-2026-003',
      jenisSurat: 'Surat Cuti Akademik',
      keperluan: 'Cuti karena alasan kesehatan',
      tanggalPengajuan: '2026-04-26',
      status: 'Menunggu Verifikasi',
      submitterName: 'Naufal Akmal',
      submitterNim: 'G6401231065'
    },
    {
      id: 'SUB-2026-004',
      jenisSurat: 'Surat Keterangan Aktif',
      keperluan: 'Pembuatan NPWP',
      tanggalPengajuan: '2026-04-25',
      tanggalVerifikasi: '2026-04-26',
      verifierName: 'Prof. Budi Wijaya',
      status: 'Ditolak',
      keteranganVerifikator: 'Dokumen pendukung tidak lengkap, harap melengkapi KTM',
      submitterName: 'Naufal Akmal',
      submitterNim: 'G6401231065'
    },
    {
      id: 'SUB-2026-005',
      jenisSurat: 'Surat Rekomendasi',
      keperluan: 'Magang di Kementerian Pertanian',
      tanggalPengajuan: '2026-04-24',
      status: 'Draft',
      submitterName: 'Naufal Akmal',
      submitterNim: 'G6401231065'
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

  const handleDownload = (submission: Submission, verified: boolean) => {
    if (verified) {
      alert(`Mengunduh surat terverifikasi: ${submission.id}`);
    } else {
      alert(`Mengunduh surat belum terverifikasi (tanpa tanda tangan): ${submission.id}`);
    }
  };

  const handleViewDetails = (submission: Submission) => {
    onViewDetail?.(submission.id);
  };

  const handleEdit = (submission: Submission) => {
    onEdit?.(submission.id);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const query = searchQuery.toLowerCase();
    return (
      sub.keperluan.toLowerCase().includes(query) ||
      sub.jenisSurat.toLowerCase().includes(query) ||
      sub.id.toLowerCase().includes(query) ||
      sub.status.toLowerCase().includes(query) ||
      (sub.keteranganVerifikator?.toLowerCase().includes(query) || false)
    );
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any = '';
    let bValue: any = '';

    switch (sortColumn) {
      case 'judul':
        aValue = a.keperluan;
        bValue = b.keperluan;
        break;
      case 'tanggalPengajuan':
        aValue = new Date(a.tanggalPengajuan).getTime();
        bValue = new Date(b.tanggalPengajuan).getTime();
        break;
      case 'tanggalVerifikasi':
        aValue = a.tanggalVerifikasi ? new Date(a.tanggalVerifikasi).getTime() : 0;
        bValue = b.tanggalVerifikasi ? new Date(b.tanggalVerifikasi).getTime() : 0;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'keterangan':
        aValue = a.keteranganVerifikator || '';
        bValue = b.keteranganVerifikator || '';
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedSubmissions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedSubmissions = sortedSubmissions.slice(startIndex, endIndex);

  // Reset to page 1 when search query or rows per page changes
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <h1 className="text-3xl font-bold mb-2">Riwayat Pengajuan</h1>
      <p className="text-gray-600 mb-8">Lihat status dan riwayat pengajuan surat Anda</p>

      {/* Search Bar and New Submission Button */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan ID atau jenis surat..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          />
        </div>
        <button
          onClick={onNewSubmission}
          className="flex items-center gap-2 bg-[#007bff] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors whitespace-nowrap"
        >
          <FileText size={20} />
          Surat Baru
        </button>
      </div>

      {/* Table Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Tampilkan</span>
          <select
            value={rowsPerPage}
            onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-600">baris</span>
        </div>

        {sortedSubmissions.length > 0 && (
          <div className="text-sm text-gray-600">
            Menampilkan {startIndex + 1} - {Math.min(endIndex, sortedSubmissions.length)} dari {sortedSubmissions.length} data
          </div>
        )}
      </div>

      {/* Submissions Table */}
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
                    Judul
                    <ArrowUpDown size={16} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                  <button
                    onClick={() => handleSort('tanggalPengajuan')}
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
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2 hover:text-[#007bff]"
                  >
                    Status
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
              {paginatedSubmissions.map((submission, index) => (
                <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                  {/* Number Column */}
                  <td className="px-6 py-4 text-sm text-gray-700">{startIndex + index + 1}</td>

                  {/* Judul Column */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{submission.keperluan}</p>
                      <p className="text-sm text-gray-500">{submission.jenisSurat}</p>
                    </div>
                  </td>

                  {/* Tanggal Pengajuan Column */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(submission.tanggalPengajuan).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">oleh {submission.submitterName}</p>
                      <p className="text-xs text-gray-500">{submission.submitterNim}</p>
                    </div>
                  </td>

                  {/* Tanggal Verifikasi Column */}
                  <td className="px-6 py-4">
                    {submission.tanggalVerifikasi ? (
                      <div>
                        <p className="text-sm font-medium text-green-700">
                          {new Date(submission.tanggalVerifikasi).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
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

                  {/* Status Column - Timeline Style */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center gap-1">
                        {submission.status === 'Draft' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <div className="w-0.5 h-8 bg-gray-200"></div>
                          </>
                        )}
                        {submission.status === 'Menunggu Verifikasi' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="w-0.5 h-8 bg-green-500 animate-pulse"></div>
                          </>
                        )}
                        {submission.status === 'Disetujui' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="w-0.5 h-8 bg-green-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </>
                        )}
                        {submission.status === 'Ditolak' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="w-0.5 h-8 bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {submission.status === 'Draft' && 'Belum diajukan'}
                          {submission.status === 'Menunggu Verifikasi' && 'Dalam proses'}
                          {submission.status === 'Disetujui' && 'Selesai'}
                          {submission.status === 'Ditolak' && 'Perlu revisi'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Keterangan Column */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">
                      {submission.keteranganVerifikator || '-'}
                    </p>
                  </td>

                  {/* Aksi Column */}
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(submission)}
                        className="p-2 text-[#007bff] hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>

                      {(submission.status === 'Draft' || submission.status === 'Ditolak') && (
                        <button
                          onClick={() => handleEdit(submission)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      )}

                      {submission.status === 'Disetujui' && (
                        <button
                          onClick={() => handleDownload(submission, true)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download Surat Terverifikasi"
                        >
                          <Download size={18} />
                        </button>
                      )}

                      {submission.status !== 'Disetujui' && submission.status !== 'Draft' && (
                        <button
                          onClick={() => handleDownload(submission, false)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Download Surat (Belum Terverifikasi)"
                        >
                          <Download size={18} />
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

        {/* Pagination */}
        {sortedSubmissions.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                const showEllipsis =
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2);

                if (!showPage && !showEllipsis) return null;

                if (showEllipsis) {
                  return (
                    <span key={page} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-[#007bff] text-white font-bold'
                        : 'border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
