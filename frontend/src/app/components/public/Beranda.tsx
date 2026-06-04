import { useState, useEffect } from 'react';
import { Eye, FileText, Clock, MessageCircle, Settings, BookOpen, HelpCircle, Users } from 'lucide-react';
import { Submission, fetchAllSubmissions, SubmissionStatus, extractTitle } from '../../utils/submissions';
import { fetchAllFormTemplates, FormTemplate } from '../../utils/formTemplates';
import { mockGuides } from '../../utils/guides';
import { api } from '../../utils/api';

interface BerandaProps {
  onSectionChange?: (section: string) => void;
  onViewSubmissionDetail?: (submissionId: string) => void;
  userRole?: string;
}

interface DashboardStats {
  pendingVerifications: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  draftSubmissions: number;
  recentActivity: Array<{ id: string; type: string; description: string; timestamp: string }>;
}

export default function Beranda({ onSectionChange, onViewSubmissionDetail, userRole = 'mahasiswa' }: BerandaProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<Submission[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [faqCount, setFaqCount] = useState(0);
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBerandaData = async () => {
      setLoading(true);
      try {
        const isMahasiswa = userRole === 'mahasiswa';
        const [subList, tplList, statsRes, pendingRes, faqRes] = await Promise.all([
          fetchAllSubmissions(),
          fetchAllFormTemplates(),
          !isMahasiswa ? api.get<any>('/dashboard/stats').catch(() => null) : Promise.resolve(null),
          !isMahasiswa ? api.get<any>('/verifications/').catch(() => null) : Promise.resolve(null),
          !isMahasiswa ? api.get<any>('/faqs/').catch(() => null) : Promise.resolve(null),
        ]);
        setSubmissions(subList || []);
        setTemplates(tplList || []);
        setStats(statsRes?.data || statsRes);
        const faqList = faqRes?.data ?? faqRes;
        const faqArr = Array.isArray(faqList) ? faqList : [];
        setFaqCount(faqArr.length);
        setFaqs(faqArr);

        const pendingData = pendingRes?.data || (Array.isArray(pendingRes) ? pendingRes : []);
        const mappedPending = Array.isArray(pendingData) ? pendingData.map((s: any) => {
          return new Submission({
            id: s.submission_id,
            jenisSurat: s.letter_type,
            keperluan: extractTitle(s.form_data, s.keperluan || 'Keperluan Akademik'),
            tanggalPengajuan: s.created_at,
            status: SubmissionStatus.PENDING,
            submitterName: s.submitter_name,
            submitterNim: s.submitter_nim || '',
            formData: {}
          });
        }) : [];
        setPendingVerifications(mappedPending);
      } catch (e) {
        console.error('Gagal mengambil data beranda:', e);
      } finally {
        setLoading(false);
      }
    };
    loadBerandaData();
  }, [userRole]);

  const allSubmissions = submissions;

  // Show all recent submissions (newest first, exclude drafts for user preview)
  const recentSubmissions = [...allSubmissions]
    .filter((sub) => !sub.isDraft())
    .sort((a, b) => new Date(b.tanggalPengajuan).getTime() - new Date(a.tanggalPengajuan).getTime());

  if (userRole === 'admin') {
    return (
      <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
        <h1 className="text-3xl font-bold mb-2">Selamat Datang di Admin Panel Schola</h1>
        <p className="text-gray-600 mb-8">IPB Academic Help Center - Kontrol Ringkasan Administratif</p>

        {/* 4 Administrative KPI Cards using live statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => onSectionChange?.('admin/forms')}
            className="bg-white border border-gray-200 p-6 rounded-lg hover:border-[#007bff] transition-all text-left shadow-sm hover:shadow"
          >
            <Settings className="text-[#007bff] mb-3" size={32} />
            <p className="text-2xl font-bold text-gray-800">{templates.length}</p>
            <p className="font-semibold text-sm text-gray-700 mt-1">Form Templates</p>
            <p className="text-xs text-gray-500 mt-0.5">Kelola Formulir & Field</p>
          </button>

          <button
            onClick={() => onSectionChange?.('admin/submissions')}
            className="bg-white border border-gray-200 p-6 rounded-lg hover:border-[#007bff] transition-all text-left shadow-sm hover:shadow"
          >
            <FileText className="text-emerald-500 mb-3" size={32} />
            <p className="text-2xl font-bold text-gray-800">{stats ? stats.totalSubmissions : submissions.length}</p>
            <p className="font-semibold text-sm text-gray-700 mt-1">Total Pengajuan</p>
            <p className="text-xs text-gray-500 mt-0.5">Audit & Validasi Surat</p>
          </button>

          <button
            onClick={() => onSectionChange?.('admin/panduan')}
            className="bg-white border border-gray-200 p-6 rounded-lg hover:border-[#007bff] transition-all text-left shadow-sm hover:shadow"
          >
            <BookOpen className="text-purple-500 mb-3" size={32} />
            <p className="text-2xl font-bold text-gray-800">{mockGuides.length}</p>
            <p className="font-semibold text-sm text-gray-700 mt-1">Panduan Penggunaan</p>
            <p className="text-xs text-gray-500 mt-0.5">Edit Langkah Prosedur</p>
          </button>

          <button
            onClick={() => onSectionChange?.('admin/faq')}
            className="bg-white border border-gray-200 p-6 rounded-lg hover:border-[#007bff] transition-all text-left shadow-sm hover:shadow"
          >
            <HelpCircle className="text-amber-500 mb-3" size={32} />
            <p className="text-2xl font-bold text-gray-800">{faqCount}</p>
            <p className="font-semibold text-sm text-gray-700 mt-1">FAQ Bantuan</p>
            <p className="text-xs text-gray-500 mt-0.5">Atur Tanya Jawab Aktif</p>
          </button>

          <button
            onClick={() => onSectionChange?.('admin/users')}
            className="bg-white border border-gray-200 p-6 rounded-lg hover:border-[#007bff] transition-all text-left shadow-sm hover:shadow"
          >
            <Users className="text-rose-500 mb-3" size={32} />
            <p className="text-2xl font-bold text-gray-800">—</p>
            <p className="font-semibold text-sm text-gray-700 mt-1">Pengguna</p>
            <p className="text-xs text-gray-500 mt-0.5">Manajemen Akun</p>
          </button>
        </div>

        {/* Dynamic Previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Recent Submissions Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-emerald-500" />
                Pengajuan Terkini
              </h2>
              <button
                onClick={() => onSectionChange?.('admin/submissions')}
                className="text-xs text-[#007bff] hover:underline font-bold"
              >
                Lihat Semua
              </button>
            </div>
            <div className="divide-y divide-gray-150">
              {submissions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-55/35 transition-colors">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{sub.jenisSurat}</p>
                    <p className="text-xs text-gray-500">Oleh: {sub.submitterName} ({sub.submitterNim})</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${sub.getStatusColorClass()}`}>
                    {sub.status}
                  </span>
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="p-6 text-center text-xs text-gray-500">Belum ada pengajuan masuk</p>
              )}
            </div>
          </div>

          {/* Form Templates Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-800 flex items-center gap-2">
                <Settings size={18} className="text-[#007bff]" />
                Template Form Aktif
              </h2>
              <button
                onClick={() => onSectionChange?.('admin/forms')}
                className="text-xs text-[#007bff] hover:underline font-bold"
              >
                Lihat Semua
              </button>
            </div>
            <div className="divide-y divide-gray-150">
              {templates.slice(0, 3).map((tpl) => (
                <div key={tpl.id} className="p-4 flex items-center justify-between hover:bg-gray-55/35 transition-colors">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{tpl.letterType}</p>
                    <p className="text-xs text-gray-500">Jumlah: {tpl.fields.length} Field</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-blue-50 text-[#007bff] text-2xs font-bold">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Guides & FAQs Preview Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Guides Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-800 flex items-center gap-2">
                <BookOpen size={18} className="text-purple-500" />
                Daftar Panduan
              </h2>
              <button
                onClick={() => onSectionChange?.('admin/panduan')}
                className="text-xs text-[#007bff] hover:underline font-bold"
              >
                Lihat Semua
              </button>
            </div>
            <div className="divide-y divide-gray-150">
              {mockGuides.slice(0, 3).map((guide) => (
                <div key={guide.id} className="p-4 flex items-center justify-between hover:bg-gray-55/35 transition-colors">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{guide.title}</p>
                    <p className="text-xs text-gray-500">{guide.steps.length} Langkah Prosedur</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-800 flex items-center gap-2">
                <HelpCircle size={18} className="text-amber-500" />
                FAQ Terdaftar
              </h2>
              <button
                onClick={() => onSectionChange?.('admin/faq')}
                className="text-xs text-[#007bff] hover:underline font-bold"
              >
                Lihat Semua
              </button>
            </div>
            <div className="divide-y divide-gray-150">
              {faqs.slice(0, 3).map((faq) => (
                <div key={faq.id} className="p-4 flex items-center justify-between hover:bg-gray-55/35 transition-colors">
                  <div>
                    <p className="font-semibold text-sm text-gray-800 truncate max-w-sm">{faq.question}</p>
                    <p className="text-xs text-gray-500 truncate max-w-sm">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD STUDENT / VERIFIER VIEW
  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <h1 className="text-3xl font-bold mb-2">Selamat Datang di Schola</h1>
      <p className="text-gray-600 mb-8">IPB Academic Help Center - Dashboard</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => onSectionChange?.('ajuan')}
          className="bg-[#007bff] text-white p-6 rounded-lg hover:bg-[#0056b3] transition-colors text-left shadow-sm"
        >
          <FileText className="mb-3" size={32} />
          <p className="font-bold text-lg">Ajukan Surat Baru</p>
          <p className="text-sm opacity-90 mt-1">Buat pengajuan surat akademik</p>
        </button>
        <button
          onClick={() => onSectionChange?.('chatbot')}
          className="bg-white text-gray-700 p-6 rounded-lg border-2 border-gray-200 hover:border-[#007bff] transition-colors text-left shadow-sm"
        >
          <MessageCircle className="mb-3" size={32} />
          <p className="font-bold text-lg">Bantuan</p>
          <p className="text-sm text-gray-600 mt-1">Chatbot dan panduan</p>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pending Verification Preview */}
        {userRole !== 'mahasiswa' && (
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
                          {submission.getFormattedDate(submission.tanggalPengajuan)}
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
        )}

        {/* Recent Submissions Preview */}
        <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${userRole === 'mahasiswa' ? 'col-span-2' : ''}`}>
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
                        {submission.getFormattedDate(submission.tanggalPengajuan)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${submission.getStatusColorClass()}`}>
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
