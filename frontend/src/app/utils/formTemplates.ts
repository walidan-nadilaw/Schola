import { api } from './api';
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
  attachments: any[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;

  constructor(data: {
    id: string;
    templateId: string;
    letterType: string;
    verifiers: SelectedVerifier[];
    isOrderedVerification: boolean;
    formData: Record<string, any>;
    attachments: any[];
    status: 'draft' | 'pending' | 'approved' | 'rejected';
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
}

// Helper functions fetching from FastAPI backend
export const fetchAllFormTemplates = async (): Promise<FormTemplate[]> => {
  try {
    const res = await api.get<any>('/templates');
    const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
    return list.map((t: any) => new FormTemplate({
      id: t.id,
      letterType: t.letter_type,
      fields: t.fields || [],
      createdAt: t.created_at || new Date().toISOString(),
      updatedAt: t.updated_at || new Date().toISOString(),
      createdBy: 'Admin'
    }));
  } catch (e) {
    console.error('Gagal mengambil daftar template formulir:', e);
    return [];
  }
};

export const fetchFormTemplateById = async (id: string): Promise<FormTemplate | null> => {
  try {
    const res = await api.get<any>(`/templates/${id}`);
    const t = res.data || res;
    return new FormTemplate({
      id: t.id,
      letterType: t.letter_type,
      fields: t.fields || [],
      createdAt: t.created_at || new Date().toISOString(),
      updatedAt: t.updated_at || new Date().toISOString(),
      createdBy: 'Admin'
    });
  } catch (e) {
    console.error(`Gagal mengambil template ${id}:`, e);
    return null;
  }
};

export const createFormTemplate = async (letterType: string, fields: FormField[]): Promise<FormTemplate | null> => {
  try {
    const res = await api.post<any>('/templates', {
      letter_type: letterType,
      description: `Formulir pengajuan untuk ${letterType}`,
      fields: fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder || '',
        helpText: f.helpText || '',
        options: f.options || []
      })),
      is_active: true
    });
    const t = res.data || res;
    return new FormTemplate({
      id: t.id,
      letterType: t.letter_type,
      fields: t.fields || [],
      createdAt: t.created_at || new Date().toISOString(),
      updatedAt: t.updated_at || new Date().toISOString(),
      createdBy: 'Admin'
    });
  } catch (e) {
    console.error('Gagal membuat template formulir:', e);
    return null;
  }
};

export const updateFormTemplate = async (id: string, letterType: string, fields: FormField[]): Promise<FormTemplate | null> => {
  try {
    const res = await api.put<any>(`/templates/${id}`, {
      letter_type: letterType,
      description: `Formulir pengajuan untuk ${letterType}`,
      fields: fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder || '',
        helpText: f.helpText || '',
        options: f.options || []
      })),
      is_active: true
    });
    const t = res.data || res;
    return new FormTemplate({
      id: t.id,
      letterType: t.letter_type,
      fields: t.fields || [],
      createdAt: t.created_at || new Date().toISOString(),
      updatedAt: t.updated_at || new Date().toISOString(),
      createdBy: 'Admin'
    });
  } catch (e) {
    console.error(`Gagal mengupdate template ${id}:`, e);
    return null;
  }
};

export const deleteFormTemplate = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/templates/${id}`);
    return true;
  } catch (e) {
    console.error(`Gagal menghapus template ${id}:`, e);
    return false;
  }
};
