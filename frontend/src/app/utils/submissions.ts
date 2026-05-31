import { api } from './api';

export enum SubmissionStatus {
  DRAFT = 'Draft',
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

  const keperluanKey = Object.keys(s.form_data || {}).find(k => k === 'Judul' || k === 'field-judul' || k.toLowerCase() === 'judul' || k.toLowerCase().includes('judul') || k.toLowerCase().includes('keperluan')) || 'Judul';
  const keperluan = s.form_data?.[keperluanKey] || s.form_data?.['Judul'] || s.form_data?.['field-judul'] || s.form_data?.['Keperluan'] || 'Keperluan Akademik';

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
export const fetchAllSubmissions = async (statusFilter?: string): Promise<Submission[]> => {
  try {
    const res = await api.get<any>('/submissions', {
      params: statusFilter ? { status_filter: statusFilter } : undefined
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
  const res = await api.post<any>('/submissions', {
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
