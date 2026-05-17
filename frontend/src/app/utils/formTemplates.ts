import { SelectedVerifier } from './users';

// Form field types remain as TypeScript types/interfaces for configuration
export type FieldType =
  | 'short_answer'
  | 'long_answer'
  | 'multiple_choice'
  | 'multiple_select'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'file_upload';

export interface FileUploadConfig {
  maxFiles?: number;
  maxSizePerFileMB?: number;
  acceptedFileTypes?: string[];
}

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // For multiple choice, multiple select, dropdown
  placeholder?: string;
  helpText?: string;
  fileConfig?: FileUploadConfig; // For file_upload type
}

// OOP Class for FormTemplate
export class FormTemplate {
  id: string;
  letterType: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  constructor(data: {
    id: string;
    letterType: string;
    fields: FormField[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  }) {
    this.id = data.id;
    this.letterType = data.letterType;
    this.fields = data.fields;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.createdBy = data.createdBy;
  }

  // Get field definition by ID
  getFieldById(id: string): FormField | undefined {
    return this.fields.find((f) => f.id === id);
  }

  // Validate if form data meets required field criteria
  validateData(formData: Record<string, any>): boolean {
    return this.fields.every((field) => !field.required || formData[field.id]);
  }
}

// OOP Class for FormDraft
export class FormDraft {
  id: string;
  templateId: string;
  letterType: string;
  verifiers: SelectedVerifier[];
  isOrderedVerification: boolean;
  formData: Record<string, any>;
  attachments: File[];
  status: 'draft' | 'finalized';
  createdAt: string;
  updatedAt: string;

  constructor(data: {
    id: string;
    templateId: string;
    letterType: string;
    verifiers: SelectedVerifier[];
    isOrderedVerification: boolean;
    formData: Record<string, any>;
    attachments: File[];
    status: 'draft' | 'finalized';
    createdAt: string;
    updatedAt: string;
  }) {
    this.id = data.id;
    this.templateId = data.templateId;
    this.letterType = data.letterType;
    this.verifiers = data.verifiers;
    this.isOrderedVerification = data.isOrderedVerification;
    this.formData = data.formData;
    this.attachments = data.attachments;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isDraft(): boolean {
    return this.status === 'draft';
  }

  isFinalized(): boolean {
    return this.status === 'finalized';
  }
}

// Mock form templates storage using OOP FormTemplate instances
export const mockFormTemplates: FormTemplate[] = [
  new FormTemplate({
    id: 'template-1',
    letterType: 'Surat Keterangan Aktif',
    fields: [
      {
        id: 'field-1',
        label: 'Keperluan',
        type: 'short_answer',
        required: true,
        placeholder: 'Contoh: Beasiswa, Magang, dll',
        helpText: 'Jelaskan untuk keperluan apa surat ini dibutuhkan'
      },
      {
        id: 'field-2',
        label: 'Semester',
        type: 'dropdown',
        required: true,
        options: ['1', '2', '3', '4', '5', '6', '7', '8']
      },
      {
        id: 'field-3',
        label: 'Keterangan Tambahan',
        type: 'long_answer',
        required: false,
        placeholder: 'Informasi tambahan (opsional)'
      }
    ],
    createdAt: '2026-05-01',
    updatedAt: '2026-05-01',
    createdBy: 'Admin'
  }),
  new FormTemplate({
    id: 'template-2',
    letterType: 'Surat Izin Penelitian',
    fields: [
      {
        id: 'field-1',
        label: 'Judul Penelitian',
        type: 'short_answer',
        required: true,
        placeholder: 'Masukkan judul penelitian'
      },
      {
        id: 'field-2',
        label: 'Lokasi Penelitian',
        type: 'short_answer',
        required: true,
        placeholder: 'Contoh: Laboratorium, Kebun Percobaan, dll'
      },
      {
        id: 'field-3',
        label: 'Tanggal Mulai Penelitian',
        type: 'date',
        required: true
      },
      {
        id: 'field-4',
        label: 'Tanggal Selesai Penelitian',
        type: 'date',
        required: true
      },
      {
        id: 'field-5',
        label: 'Deskripsi Penelitian',
        type: 'long_answer',
        required: true,
        placeholder: 'Jelaskan secara singkat tentang penelitian yang akan dilakukan'
      },
      {
        id: 'field-6',
        label: 'Jenis Penelitian',
        type: 'multiple_choice',
        required: true,
        options: ['Skripsi', 'Tesis', 'Disertasi', 'Penelitian Mandiri', 'Lainnya']
      }
    ],
    createdAt: '2026-05-01',
    updatedAt: '2026-05-01',
    createdBy: 'Admin'
  }),
  new FormTemplate({
    id: 'template-3',
    letterType: 'Surat Cuti Akademik',
    fields: [
      {
        id: 'field-1',
        label: 'Alasan Cuti',
        type: 'multiple_choice',
        required: true,
        options: ['Kesehatan', 'Keuangan', 'Keluarga', 'Pekerjaan', 'Lainnya']
      },
      {
        id: 'field-2',
        label: 'Penjelasan Detail',
        type: 'long_answer',
        required: true,
        placeholder: 'Jelaskan secara detail alasan mengajukan cuti akademik'
      },
      {
        id: 'field-3',
        label: 'Durasi Cuti',
        type: 'dropdown',
        required: true,
        options: ['1 Semester', '2 Semester', '3 Semester', '4 Semester']
      },
      {
        id: 'field-4',
        label: 'Tanggal Mulai Cuti',
        type: 'date',
        required: true
      },
      {
        id: 'field-5',
        label: 'Persetujuan Orang Tua/Wali',
        type: 'multiple_choice',
        required: true,
        options: ['Sudah', 'Belum']
      }
    ],
    createdAt: '2026-05-01',
    updatedAt: '2026-05-01',
    createdBy: 'Admin'
  })
];

// Mock drafts storage using FormDraft class instances
export const mockDrafts: FormDraft[] = [];

// Helper functions returning OOP instances
export const getFormTemplateByLetterType = (letterType: string): FormTemplate | undefined => {
  return mockFormTemplates.find((template) => template.letterType === letterType);
};

export const getFormTemplateById = (id: string): FormTemplate | undefined => {
  return mockFormTemplates.find((template) => template.id === id);
};

export const getAllFormTemplates = (): FormTemplate[] => {
  return mockFormTemplates;
};

export const saveDraft = (draft: FormDraft): void => {
  const existingIndex = mockDrafts.findIndex((d) => d.id === draft.id);
  if (existingIndex >= 0) {
    mockDrafts[existingIndex] = draft;
  } else {
    mockDrafts.push(draft);
  }
};

export const getDraftById = (id: string): FormDraft | undefined => {
  return mockDrafts.find((d) => d.id === id);
};

export const getAllDrafts = (): FormDraft[] => {
  return mockDrafts.filter((d) => d.status === 'draft');
};
