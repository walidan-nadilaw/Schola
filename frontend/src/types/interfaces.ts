/**
 * Core TypeScript interfaces for the Schola application.
 * These define the shape of data exchanged between frontend and backend.
 */

import { RoleType, SubmissionStatus, VerificationStatus, VerifierRole, FieldType } from './enums';

// ─── Auth Interfaces ─────────────────────────────────────────

export interface IUserJSON {
  id: number;
  email: string;
  nama: string;
  role: RoleType;
  created_at: string;
}

export interface IAuthResponse {
  access_token: string;
  token_type: string;
  user: IUserJSON;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  email: string;
  nama: string;
  role: RoleType;
  password: string;
  nim?: string;
  fakultas?: string;
  program_studi?: string;
  status_aktif?: string;
  unit_kerja?: string;
  nip?: string;
  jabatan?: string;
}

// ─── Form Template Interfaces ────────────────────────────────

export interface IFileUploadConfig {
  maxFiles?: number;
  maxSizePerFileMB?: number;
  acceptedFileTypes?: string[];
}

export interface IFormFieldJSON {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  help_text?: string;
  file_config?: IFileUploadConfig;
}

export interface IFormTemplateJSON {
  id: string;
  letter_type: string;
  fields: IFormFieldJSON[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ─── Submission Interfaces ───────────────────────────────────

export interface IVerifierJSON {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  order?: number;
  verifier_role?: VerifierRole;
  status?: VerificationStatus;
  verified_at?: string;
}

export interface IAttachmentJSON {
  id: string;
  filename: string;
  size: string;
  url?: string;
}

export interface ISubmissionJSON {
  id: string;
  jenis_surat: string;
  keperluan: string;
  tanggal_pengajuan: string;
  tanggal_verifikasi?: string;
  status: SubmissionStatus;
  keterangan_verifikator?: string;
  form_data: Record<string, unknown>;
  verifiers: IVerifierJSON[];
  attachments: IAttachmentJSON[];
  submitter_name: string;
  submitter_nim: string;
}

// ─── API Response Wrapper ────────────────────────────────────

export interface IApiError {
  detail: string;
  status_code?: number;
}

// ─── Notification ────────────────────────────────────────────

export interface INotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}
