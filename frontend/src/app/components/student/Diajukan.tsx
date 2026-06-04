import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Download, Eye, Edit, FileText, ChevronLeft, ChevronRight, ArrowUpDown, Trash2 } from 'lucide-react';
import { Submission, SubmissionStatus, fetchAllSubmissions, deleteSubmissionDraft, downloadSubmissionLetter } from '../../utils/submissions';

interface DiajukanProps {
  onNewSubmission?: () => void;
  onViewDetail?: (submissionId: string) => void;
  onEdit?: (submissionId: string) => void;
}

type SortableColumn = 'judul' | 'tanggalPengajuan' | 'tanggalVerifikasi' | 'status' | 'keterangan';

export default function Diajukan({ onNewSubmission, onViewDetail, onEdit }: DiajukanProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Load submissions from backend API
  useEffect(() => {
    const loadSubmissions = async () => {
      setLoading(true);
      try {
        const data = await fetchAllSubmissions();
        setSubmissions(data);
      } catch (e) {
        console.error('Error fetching submissions:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSubmissions();
  }, []);

  const handleDownload = (submission: Submission) => {
    const opened = downloadSubmissionLetter(submission);
    if (!opened) {
      toast.error('Popup diblokir browser. Izinkan popup untuk mengunduh surat.');
    }
  };

  const handleViewDetails = (submission: Submission) => {
    onViewDetail?.(submission.id);
  };

  const handleEdit = (submission: Submission) => {
    onEdit?.(submission.id);
  };

  const handleDelete = async (submission: Submission) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus draft pengajuan "${submission.keperluan}"?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await deleteSubmissionDraft(submission.id);
      toast.success('Draft pengajuan berhasil dihapus.');
      const data = await fetchAllSubmissions();
      setSubmissions(data);
    } catch (e: any) {
      toast.error(`Gagal menghapus draft: ${e.message}`);
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
    return (
      sub.keperluan.toLowerCase().includes(query) ||
      sub.jenisSurat.toLowerCase().includes(query) ||
      sub.id.toLowerCase().includes(query) ||
      sub.status.toLowerCase().includes(query) ||
      (sub.keteranganVerifikator?.toLowerCase().includes(query) ?? false)
    );
  });

  const sortedSubmissions = sortColumn
    ? Submission.sortByColumn(filteredSubmissions, sortColumn, sortDirection)
    : filteredSubmissions;

  // Pagination calculations
  const totalPages = Math.ceil(sortedSubmissions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedSubmissions = sortedSubmissions.slice(startIndex, endIndex);

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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="animate-spin h-8 w-8 text-[#007bff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-500 font-medium">Memuat data pengajuan resmi...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSubmissions.map((submission, index) => (
                <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
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
                    <p className="text-sm font-medium text-gray-900">
                      {submission.getFormattedDate(submission.tanggalPengajuan)}
                    </p>
                  </td>

                  {/* Tanggal Verifikasi Column */}
                  <td className="px-6 py-4">
                    {submission.tanggalVerifikasi ? (
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

                  {/* Status Column - Using OOP properties */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        {submission.isDraft() && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <div className="w-0.5 h-8 bg-gray-200"></div>
                          </>
                        )}
                        {submission.isPending() && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="w-0.5 h-8 bg-green-500 animate-pulse"></div>
                          </>
                        )}
                        {submission.isFullyApproved() && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="w-0.5 h-8 bg-green-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </>
                        )}
                        {submission.status === SubmissionStatus.REJECTED && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="w-0.5 h-8 bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${submission.getStatusColorClass()}`}>
                          {submission.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {submission.isDraft() && 'Belum diajukan'}
                          {submission.isPending() && 'Dalam proses'}
                          {submission.isFullyApproved() && 'Selesai'}
                          {submission.status === SubmissionStatus.REJECTED && 'Perlu revisi'}
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

                      {submission.canBeEdited() && (
                        <button
                          onClick={() => handleEdit(submission)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      )}

                      {submission.isDraft() && (
                        <button
                          onClick={() => handleDelete(submission)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Draft"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}

                      {submission.isFullyApproved() ? (
                        <button
                          onClick={() => handleDownload(submission)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download Surat Terverifikasi"
                        >
                          <Download size={18} />
                        </button>
                      ) : (
                        !submission.isDraft() && (
                          <button
                            onClick={() => handleDownload(submission)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Download Surat (Belum Terverifikasi)"
                          >
                            <Download size={18} />
                          </button>
                        )
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
