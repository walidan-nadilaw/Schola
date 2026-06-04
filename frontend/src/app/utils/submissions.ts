import { api } from './api';

export enum SubmissionStatus {
  DRAFT = 'Draf',
  PENDING = 'Menunggu Verifikasi',
  APPROVED = 'Disetujui',
  REJECTED = 'Ditolak'
}

export class Submission {
  id: string;
  jenisSurat: string;
  keperluan: string;
  tanggalPengajuan: string;
  tanggalVerifikasi?: string;
  verifierName?: string;
  status: SubmissionStatus;
  keteranganVerifikator?: string;
  submitterName: string;
  submitterNim: string;
  formData: Record<string, any>;
  attachments: { name: string; size: string; id?: string; path?: string }[];
  verifiers: { name: string; role: string; status: string; date: string; comment?: string; signature_hash?: string }[];
  role?: 'verifier' | 'signer'; // For verifier context

  constructor(data: {
    id: string;
    jenisSurat: string;
    keperluan: string;
    tanggalPengajuan: string;
    tanggalVerifikasi?: string;
    verifierName?: string;
    status: SubmissionStatus;
    keteranganVerifikator?: string;
    submitterName: string;
    submitterNim: string;
    formData?: Record<string, any>;
    attachments?: { name: string; size: string; id?: string; path?: string }[];
    verifiers?: { name: string; role: string; status: string; date: string; comment?: string; signature_hash?: string }[];
    role?: 'verifier' | 'signer';
  }) {
    this.id = data.id;
    this.jenisSurat = data.jenisSurat;
    this.keperluan = data.keperluan;
    this.tanggalPengajuan = data.tanggalPengajuan;
    this.tanggalVerifikasi = data.tanggalVerifikasi;
    this.verifierName = data.verifierName;
    this.status = data.status;
    this.keteranganVerifikator = data.keteranganVerifikator;
    this.submitterName = data.submitterName;
    this.submitterNim = data.submitterNim;
    this.formData = data.formData || {};
    this.attachments = data.attachments || [];
    this.verifiers = data.verifiers || [];
    this.role = data.role;
  }

  // OOP Methods to encapsulate Business Rules & Logic

  // Verify if the current submission can be edited by the student
  canBeEdited(): boolean {
    return this.status === SubmissionStatus.DRAFT || this.status === SubmissionStatus.REJECTED;
  }

  // Check if it's currently a draft
  isDraft(): boolean {
    return this.status === SubmissionStatus.DRAFT;
  }

  // Check if the submission has been fully approved/signed
  isFullyApproved(): boolean {
    return this.status === SubmissionStatus.APPROVED;
  }

  // Check if the submission is pending review
  isPending(): boolean {
    return this.status === SubmissionStatus.PENDING;
  }

  // Get color styles for the status badge
  getStatusColorClass(): string {
    switch (this.status) {
      case SubmissionStatus.APPROVED:
        return 'bg-green-100 text-green-700 border border-green-200';
      case SubmissionStatus.REJECTED:
        return 'bg-red-100 text-red-700 border border-red-200';
      case SubmissionStatus.DRAFT:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    }
  }

  // Formatted date for consistent ID locales
  getFormattedDate(dateStr?: string): string {
    const target = dateStr || this.tanggalPengajuan;
    if (!target) return '-';
    return new Date(target).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Encapsulated static sorting method to prevent code duplication & eliminate type safety smells
  static sortByColumn(
    submissions: Submission[],
    column: 'judul' | 'tanggalPengajuan' | 'tanggalVerifikasi' | 'status' | 'keterangan' | 'tanggalSubmit',
    direction: 'asc' | 'desc'
  ): Submission[] {
    return [...submissions].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (column) {
        case 'judul':
          aValue = a.keperluan;
          bValue = b.keperluan;
          break;
        case 'tanggalPengajuan':
        case 'tanggalSubmit':
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

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
}

// Helper: Extract submission title from form_data using a consistent key chain
export const extractTitle = (
  formData?: Record<string, any>,
  fallback = 'Keperluan Akademik'
): string => {
  if (!formData) return fallback;
  const key = Object.keys(formData).find(
    k => k === 'Judul' || k === 'field-judul' || k.toLowerCase() === 'judul' || k.toLowerCase().includes('judul')
  );
  return (key ? formData[key] : undefined) ?? formData['Keperluan'] ?? fallback;
};

// Helper: Map status from backend lowercase to SubmissionStatus enum
export const mapStatusFromBackend = (status: string): SubmissionStatus => {
  const s = status.toLowerCase();
  if (s === 'draft') return SubmissionStatus.DRAFT;
  if (s === 'approved') return SubmissionStatus.APPROVED;
  if (s === 'rejected') return SubmissionStatus.REJECTED;
  return SubmissionStatus.PENDING; // 'pending'
};

// Helper: Map backend JSON to frontend Submission object
export const mapBackendToSubmission = (s: any): Submission => {
  const attachments = (s.attachments || []).map((att: any) => ({
    name: att.file_name,
    size: `${(att.file_size / 1024).toFixed(0)} KB`,
    id: att.id,
    path: att.file_path
  }));

  const verifiers = (s.verifiers || []).map((v: any) => ({
    name: v.verifier_name,
    role: v.verifier_role || 'Verifikator',
    status: v.status === 'approved' ? 'Disetujui' : v.status === 'rejected' ? 'Ditolak' : v.status === 'cancelled' ? 'Dibatalkan' : 'Pending',
    date: v.verified_at ? new Date(v.verified_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '',
    comment: v.comment,
    signature_hash: v.signature_hash
  }));

  const keperluan = extractTitle(s.form_data);

  return new Submission({
    id: s.id,
    jenisSurat: s.letter_type,
    keperluan: keperluan,
    tanggalPengajuan: s.submitted_at || s.created_at,
    tanggalVerifikasi: s.verified_at,
    verifierName: verifiers.length > 0 ? verifiers[verifiers.length - 1].name : undefined,
    status: mapStatusFromBackend(s.status),
    keteranganVerifikator: s.rejection_reason || undefined,
    submitterName: s.submitter_name || s.submitter?.name || 'Mahasiswa',
    submitterNim: s.submitter_nim || s.submitter?.nim || 'NIM',
    formData: s.form_data || {},
    attachments: attachments,
    verifiers: verifiers
  });
};

// Helper methods to access FastAPI backend
export const fetchAllSubmissions = async (statusFilter?: string, mine?: boolean): Promise<Submission[]> => {
  try {
    const params: Record<string, any> = {};
    if (statusFilter) params.status = statusFilter;
    if (mine === false) params.mine = false;
    const res = await api.get<any>('/submissions/', {
      params: Object.keys(params).length > 0 ? params : undefined
    });
    const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
    return list.map(mapBackendToSubmission);
  } catch (e) {
    console.error('Gagal mengambil daftar pengajuan:', e);
    return [];
  }
};

export const fetchSubmissionById = async (id: string): Promise<Submission | null> => {
  try {
    const res = await api.get<any>(`/submissions/${encodeURIComponent(id)}`);
    const data = res.data || res;
    return mapBackendToSubmission(data);
  } catch (e) {
    console.error(`Gagal mengambil detail pengajuan ${id}:`, e);
    return null;
  }
};

export const createSubmission = async (templateId: string, formData: Record<string, any>): Promise<Submission> => {
  const res = await api.post<any>('/submissions/', {
    template_id: templateId,
    form_data: formData
  });
  const data = res.data || res;
  return mapBackendToSubmission(data);
};

export const updateSubmissionDraft = async (id: string, formData: Record<string, any>, isOrdered: boolean): Promise<Submission> => {
  const res = await api.put<any>(`/submissions/${encodeURIComponent(id)}`, {
    form_data: formData,
    is_ordered_verification: isOrdered
  });
  const data = res.data || res;
  return mapBackendToSubmission(data);
};

export const deleteSubmissionDraft = async (id: string): Promise<void> => {
  await api.delete(`/submissions/${encodeURIComponent(id)}`);
};

export const sendFinalizeSubmission = async (id: string, verifiersOrder: string[], isOrdered: boolean = true): Promise<Submission> => {
  const res = await api.post<any>(`/submissions/${encodeURIComponent(id)}/submit`, {
    verifiers: verifiersOrder,
    is_ordered_verification: isOrdered
  });
  const data = res.data || res;
  return mapBackendToSubmission(data);
};

export const uploadAttachmentForSubmission = async (submissionId: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<any>(`/files/upload`, formData, {
    params: { submission_id: submissionId }
  });
  return res?.data ?? res;
};

/**
 * Build the same A4 letter shown in the SubmissionDetail preview and open it in a
 * new tab with the browser print dialog (user picks "Save as PDF"). Inline CSS so
 * it renders without Tailwind. Returns false if the popup was blocked.
 */
export const downloadSubmissionLetter = (submission: Submission): boolean => {
  const esc = (s: any) =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
    );
  const approved = submission.isFullyApproved();
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const signatureBlock = approved
    ? `<div style="margin-bottom:8px"><div style="font-size:11px;color:#16a34a;font-style:italic;margin-bottom:4px">Ditandatangani secara digital</div>
         <div style="border:2px solid #22c55e;border-radius:6px;padding:8px;background:#f0fdf4">
           <div style="font-weight:bold">Prof. Budi Wijaya</div><div style="font-size:11px">NIP. 196512151990031002</div></div></div>`
    : `<div style="margin-bottom:8px"><div style="font-size:11px;color:#9ca3af;font-style:italic;margin-bottom:4px">Menunggu tanda tangan</div>
         <div style="border:2px dashed #d1d5db;border-radius:6px;padding:8px"><div style="font-weight:bold;color:#9ca3af">Belum Ditandatangani</div></div></div>`;

  const verifHistory = approved
    ? `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #d1d5db;font-size:11px;color:#4b5563">
         <div style="font-weight:bold;margin-bottom:8px">Riwayat Verifikasi:</div>
         ${submission.verifiers
           .map((v) => `<div style="display:flex;justify-content:space-between;padding:2px 0"><span>✓ ${esc(v.name)} (${esc(v.role)})</span><span style="color:#6b7280">${esc(v.date)}</span></div>`)
           .join('')}
       </div>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(submission.jenisSurat)} - ${esc(submission.id)}</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Times New Roman', serif; color: #111; background: #e5e7eb; }
      .toolbar { display: flex; align-items: center; gap: 12px; padding: 12px 24px;
                 background: #1f2937; position: sticky; top: 0; z-index: 10; }
      .toolbar button { background: #2563eb; color: #fff; border: none; padding: 8px 20px;
                        border-radius: 6px; font-size: 14px; cursor: pointer; font-family: sans-serif; }
      .toolbar button:hover { background: #1d4ed8; }
      .toolbar span { color: #d1d5db; font-size: 13px; font-family: sans-serif; }
      .page { width: 210mm; min-height: 297mm; margin: 24px auto; background: #fff;
              padding: 20mm; box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
      .label { display: inline-block; width: 130px; }
      @media print {
        @page { size: A4; margin: 20mm; }
        body { background: #fff; }
        .toolbar { display: none; }
        .page { width: auto; margin: 0; padding: 0; box-shadow: none; min-height: auto; }
      }
    </style></head>
    <body>
      <div class="toolbar">
        <button onclick="window.print()">⬇ Simpan sebagai PDF</button>
        <span>Pilih tujuan "Save as PDF" di dialog cetak</span>
      </div>
      <div class="page">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-weight:bold;font-size:18px;margin-bottom:4px">INSTITUT PERTANIAN BOGOR</div>
          <div style="font-size:13px">Jl. Raya Dramaga, Kampus IPB Dramaga, Bogor 16680</div>
          <div style="font-size:13px">Telp: (0251) 8622642 | Email: rektorat@ipb.ac.id</div>
          <div style="border-top:2px solid #000;margin-top:8px"></div>
        </div>
        <div style="margin-bottom:24px;font-size:13px">
          <div>Nomor: ${esc(submission.id)}/IPB/2026</div>
          <div>Tanggal: ${esc(submission.getFormattedDate(submission.tanggalPengajuan))}</div>
        </div>
        <div style="text-align:center;font-weight:bold;font-size:18px;margin-bottom:24px;text-decoration:underline">${esc(submission.jenisSurat.toUpperCase())}</div>
        <div style="font-size:13px;line-height:1.7">
          <p style="margin-bottom:12px">Yang bertanda tangan di bawah ini, Dekan Fakultas Pertanian Institut Pertanian Bogor, menerangkan bahwa:</p>
          <div style="margin-left:32px;margin-top:8px;margin-bottom:12px">
            <div><span class="label">Nama</span>: <strong>${esc(submission.submitterName)}</strong></div>
            <div><span class="label">NIM</span>: <strong>${esc(submission.submitterNim)}</strong></div>
            <div><span class="label">Program Studi</span>: <strong>S1 Agronomi</strong></div>
            <div><span class="label">Fakultas</span>: <strong>Fakultas Pertanian</strong></div>
          </div>
          <p style="margin-bottom:12px">Adalah benar mahasiswa aktif pada Institut Pertanian Bogor semester ${esc(submission.formData['Semester'] || '-')} dan sedang menempuh pendidikan di program studi S1 Agronomi.</p>
          <p style="margin-bottom:12px">Surat keterangan ini dibuat untuk keperluan <strong>${esc(submission.formData['Keperluan'] || submission.keperluan)}</strong>.</p>
          <p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
        </div>
        <div style="margin-top:48px;display:flex;justify-content:flex-end">
          <div style="text-align:center;font-size:13px;width:240px">
            <div style="margin-bottom:64px">
              <div>Bogor, ${esc(today)}</div>
              <div style="font-weight:500">Dekan,</div>
            </div>
            ${signatureBlock}
          </div>
        </div>
        ${verifHistory}
      </div>
    </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // Give the new document a tick to lay out before printing.
  setTimeout(() => win.print(), 300);
  return true;
};
