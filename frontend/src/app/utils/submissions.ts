// OOP Submission Model and Mock Database Services

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
  attachments: { name: string; size: string }[];
  verifiers: { name: string; role: string; status: string; date: string }[];
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
    attachments?: { name: string; size: string }[];
    verifiers?: { name: string; role: string; status: string; date: string }[];
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
        return 'bg-green-100 text-green-700';
      case SubmissionStatus.REJECTED:
        return 'bg-red-100 text-red-700';
      case SubmissionStatus.DRAFT:
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
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

// Global Centralized Mock Submissions
export const mockSubmissions: Submission[] = [
  new Submission({
    id: 'SUB-2026-001',
    jenisSurat: 'Surat Keterangan Aktif',
    keperluan: 'Beasiswa LPDP',
    tanggalPengajuan: '2026-04-28',
    tanggalVerifikasi: '2026-04-29',
    verifierName: 'Dr. Ahmad Santoso',
    status: SubmissionStatus.APPROVED,
    keteranganVerifikator: 'Dokumen lengkap dan memenuhi syarat',
    submitterName: 'Naufal Akmal',
    submitterNim: 'G6401231065',
    formData: {
      'Keperluan': 'Beasiswa LPDP',
      'Semester': '6',
      'Keterangan Tambahan': 'Untuk melanjutkan studi S2'
    },
    verifiers: [
      { name: 'Dr. Ahmad Santoso', role: 'Dosen Pembimbing', status: 'Disetujui', date: '2026-04-28 10:30' },
      { name: 'Dr. Siti Rahayu', role: 'Kepala Departemen', status: 'Disetujui', date: '2026-04-28 14:20' },
      { name: 'Prof. Budi Wijaya', role: 'Dekan', status: 'Disetujui', date: '2026-04-28 16:45' }
    ],
    attachments: [
      { name: 'KTM.pdf', size: '245 KB' },
      { name: 'Transkrip.pdf', size: '512 KB' }
    ],
    role: 'verifier'
  }),
  new Submission({
    id: 'SUB-2026-002',
    jenisSurat: 'Surat Izin Penelitian',
    keperluan: 'Penelitian Tugas Akhir di PT Indofood',
    tanggalPengajuan: '2026-04-27',
    status: SubmissionStatus.PENDING,
    submitterName: 'Naufal Akmal',
    submitterNim: 'G6401231065',
    formData: {
      'Judul Penelitian': 'Penelitian Tugas Akhir di PT Indofood',
      'Lokasi Penelitian': 'Pabrik PT Indofood, Bogor',
      'Tanggal Mulai Penelitian': '2026-05-10',
      'Tanggal Selesai Penelitian': '2026-08-10',
      'Deskripsi Penelitian': 'Penelitian tentang efisiensi rantai pasok agroindustri',
      'Jenis Penelitian': 'Skripsi'
    },
    verifiers: [
      { name: 'Dr. Ahmad Santoso', role: 'Dosen Pembimbing', status: 'Disetujui', date: '2026-04-28 11:00' },
      { name: 'Dr. Siti Rahayu', role: 'Kepala Departemen', status: 'Disetujui', date: '2026-04-28 15:30' },
      { name: 'Prof. Budi Wijaya', role: 'Dekan', status: 'Pending', date: '' }
    ],
    attachments: [
      { name: 'Proposal_Penelitian.pdf', size: '1.2 MB' }
    ],
    role: 'signer'
  }),
  new Submission({
    id: 'SUB-2026-003',
    jenisSurat: 'Surat Cuti Akademik',
    keperluan: 'Cuti karena alasan kesehatan',
    tanggalPengajuan: '2026-04-26',
    status: SubmissionStatus.PENDING,
    submitterName: 'Naufal Akmal',
    submitterNim: 'G6401231065',
    formData: {
      'Alasan Cuti': 'Kesehatan',
      'Penjelasan Detail': 'Cuti karena memerlukan pemulihan medis pasca operasi',
      'Durasi Cuti': '1 Semester',
      'Tanggal Mulai Cuti': '2026-05-01',
      'Persetujuan Orang Tua/Wali': 'Sudah'
    },
    verifiers: [
      { name: 'Dr. Ahmad Santoso', role: 'Dosen Akademik', status: 'Pending', date: '' }
    ],
    attachments: [
      { name: 'Surat_Keterangan_Dokter.pdf', size: '890 KB' }
    ],
    role: 'verifier'
  }),
  new Submission({
    id: 'SUB-2026-004',
    jenisSurat: 'Surat Keterangan Aktif',
    keperluan: 'Pembuatan NPWP',
    tanggalPengajuan: '2026-04-25',
    tanggalVerifikasi: '2026-04-26',
    verifierName: 'Prof. Budi Wijaya',
    status: SubmissionStatus.REJECTED,
    keteranganVerifikator: 'Dokumen pendukung tidak lengkap, harap melengkapi KTM',
    submitterName: 'Naufal Akmal',
    submitterNim: 'G6401231065',
    formData: {
      'Keperluan': 'Pembuatan NPWP',
      'Semester': '6',
      'Keterangan Tambahan': 'NPWP diperlukan untuk magang mandiri'
    },
    verifiers: [
      { name: 'Dr. Ahmad Santoso', role: 'Dosen Pembimbing', status: 'Disetujui', date: '2026-04-25 09:30' },
      { name: 'Prof. Budi Wijaya', role: 'Dekan', status: 'Ditolak', date: '2026-04-26 14:00' }
    ],
    role: 'signer'
  }),
  new Submission({
    id: 'SUB-2026-005',
    jenisSurat: 'Surat Rekomendasi',
    keperluan: 'Magang di Kementerian Pertanian',
    tanggalPengajuan: '2026-04-24',
    status: SubmissionStatus.DRAFT,
    submitterName: 'Naufal Akmal',
    submitterNim: 'G6401231065',
    formData: {
      'Instansi Tujuan': 'Kementerian Pertanian RI',
      'Posisi Magang': 'Analyst Data Pertanian',
      'Durasi Magang': '3 Bulan'
    },
    role: 'verifier'
  })
];

// Helper methods to access mock database services
export const getAllSubmissions = (): Submission[] => {
  return mockSubmissions;
};

export const getSubmissionById = (id: string): Submission | undefined => {
  return mockSubmissions.find((sub) => sub.id === id);
};

export const addSubmission = (sub: Submission): void => {
  mockSubmissions.push(sub);
};

export const updateSubmissionInMock = (id: string, updates: Partial<Submission>): void => {
  const idx = mockSubmissions.findIndex((s) => s.id === id);
  if (idx >= 0) {
    mockSubmissions[idx] = new Submission({
      ...mockSubmissions[idx],
      ...updates
    });
  }
};
