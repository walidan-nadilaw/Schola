import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Download, User, FileText, CheckCircle, Edit2, XCircle, Clock, Eye, X } from 'lucide-react';
import { Submission, SubmissionStatus, fetchSubmissionById, downloadSubmissionLetter } from '../../utils/submissions';
import { fileDownloadUrl } from '../../utils/api';
import LetterPreview from '../shared/LetterPreview';

interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
  onEdit?: (submissionId: string) => void;
}

export default function SubmissionDetail({ submissionId, onBack, onEdit }: SubmissionDetailProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubmission = async () => {
      setLoading(true);
      try {
        const sub = await fetchSubmissionById(submissionId);
        setSubmission(sub);
      } catch (e) {
        console.error('Gagal memuat detail pengajuan:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSubmission();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center gap-3 h-64">
        <svg className="animate-spin h-8 w-8 text-[#007bff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500 font-medium">Memuat detail pengajuan...</p>
      </div>
    );
  }

  // Fallback in case submission isn't found
  if (!submission) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold">Pengajuan tidak ditemukan.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
          Kembali
        </button>
      </div>
    );
  }

  // Calculate verifiers counts
  const totalVerifiers = submission.verifiers.length || 3;
  const approvedCount = submission.verifiers.filter(v => v.status === 'Disetujui').length;

  // Build the A4 letter and open the browser print dialog (user picks "Save as PDF").
  // Shared with the Riwayat Pengajuan download button so output is identical.
  const handleDownloadSurat = () => {
    const opened = downloadSubmissionLetter(submission);
    if (!opened) {
      toast.error('Popup diblokir browser. Izinkan popup untuk mengunduh surat.');
    }
  };

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif] h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Kembali ke Riwayat
            </button>
            <h1 className="text-3xl font-bold mb-2">Detail Pengajuan</h1>
            <p className="text-gray-600">ID: {submission.id}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {submission.canBeEdited() && (
              <button
                onClick={() => onEdit?.(submission.id)}
                className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors"
              >
                <Edit2 size={20} />
                Edit Pengajuan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Layout */}
      <div className="flex-1 overflow-hidden">
        {/* Form Details */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-y-auto h-full">
          <div className="p-6 space-y-6">
            {/* Status */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FileText size={20} className="text-[#007bff]" />
                Status Pengajuan
              </h3>
              <div className={`border rounded-lg p-4 ${
                submission.isFullyApproved() ? 'bg-green-50 border-green-200' :
                submission.status === SubmissionStatus.REJECTED ? 'bg-red-50 border-red-200' :
                submission.isDraft() ? 'bg-gray-50 border-gray-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {submission.isFullyApproved() && <CheckCircle className="text-green-500" size={24} />}
                  {submission.status === SubmissionStatus.REJECTED && <XCircle className="text-red-500" size={24} />}
                  {submission.isDraft() && <FileText className="text-gray-500" size={24} />}
                  {submission.isPending() && <Clock className="text-yellow-500" size={24} />}
                  <span className={`font-bold ${
                    submission.isFullyApproved() ? 'text-green-700' :
                    submission.status === SubmissionStatus.REJECTED ? 'text-red-700' :
                    submission.isDraft() ? 'text-gray-700' :
                    'text-yellow-700'
                  }`}>{submission.status}</span>
                </div>
                {!submission.isDraft() && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          submission.isFullyApproved() ? 'bg-green-500' :
                          submission.status === SubmissionStatus.REJECTED ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${(approvedCount / totalVerifiers) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{approvedCount}/{totalVerifiers}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Student Info */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <User size={20} className="text-[#007bff]" />
                Data Mahasiswa
              </h3>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama</span>
                  <span className="font-medium">{submission.submitterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">NIM</span>
                  <span className="font-medium">{submission.submitterNim}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Program Studi</span>
                  <span className="font-medium">S1 Agronomi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fakultas</span>
                  <span className="font-medium">Fakultas Pertanian</span>
                </div>
              </div>
            </div>

            {/* Form Data */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FileText size={20} className="text-[#007bff]" />
                Data Formulir
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Jenis Surat</p>
                  <p className="font-bold">{submission.jenisSurat}</p>
                </div>
                {Object.entries(submission.formData).map(([key, value]) => {
                  const isFileArray = Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && ('path' in value[0] || 'file_path' in value[0]);
                  
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">{key}</p>
                      {isFileArray ? (
                        <div className="space-y-2 mt-1">
                          {(value as any[]).map((file, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const filePath = file.path || file.file_path;
                                if (filePath) {
                                  window.open(fileDownloadUrl(filePath), '_blank');
                                }
                              }}
                              className="flex items-center gap-2 text-[#007bff] hover:underline text-sm font-semibold"
                            >
                              <FileText size={16} />
                              <span>{file.name || 'Dokumen'}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attachments */}
            {submission.attachments.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3">Dokumen Lampiran</h3>
                <div className="space-y-2">
                  {submission.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="text-[#007bff]" size={20} />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (file.path) {
                            window.open(fileDownloadUrl(file.path), '_blank');
                          } else {
                            toast.info(`Lampiran belum tersedia: ${file.name}`);
                          }
                        }}
                        className="p-2 text-[#007bff] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verifiers Timeline */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <CheckCircle size={20} className="text-[#007bff]" />
                Riwayat Verifikasi
              </h3>
              <div className="space-y-3">
                {submission.verifiers.map((verifier, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4">
                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{verifier.name}</p>
                      <p className="text-sm text-gray-600">{verifier.role}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {verifier.status}
                        </span>
                        {verifier.date && <span className="text-xs text-gray-500">{verifier.date}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FileText size={20} className="text-[#007bff]" />
                Preview Surat
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Lihat preview surat dalam format A4 sebelum mengunduh
              </p>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#007bff] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors"
              >
                <Eye size={20} />
                Lihat Preview Surat
              </button>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreviewModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowPreviewModal(false)}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <h3 className="font-bold flex items-center gap-2">
                    <FileText size={20} className="text-[#007bff]" />
                    Preview Surat (A4)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadSurat}
                      className="flex items-center gap-2 bg-[#007bff] text-white px-4 py-2 rounded-lg hover:bg-[#0056b3] transition-colors"
                    >
                      <Download size={18} />
                      Download PDF
                    </button>
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* A4 PDF Preview */}
                <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
                  <LetterPreview submission={submission} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
