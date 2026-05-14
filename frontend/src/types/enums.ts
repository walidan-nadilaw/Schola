/**
 * Enumerations used across the Schola application.
 * Mirrors backend Python enums for type safety.
 */

/** User roles — matches backend RoleType enum */
export enum RoleType {
  OPERATOR = 'operator',
  DOSEN_PEJABAT = 'dosen_pejabat',
  MAHASISWA = 'mahasiswa',
}

/** Submission lifecycle statuses */
export enum SubmissionStatus {
  DRAFT = 'Draft',
  PENDING = 'Menunggu Verifikasi',
  APPROVED = 'Disetujui',
  REJECTED = 'Ditolak',
}

/** Verification step statuses */
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

/** Verifier role within a submission */
export enum VerifierRole {
  VERIFIKATOR = 'verifikator',
  PENANDATANGAN = 'penandatangan',
}

/** Dynamic form field types — matches Figma FormBuilder */
export enum FieldType {
  SHORT_ANSWER = 'short_answer',
  LONG_ANSWER = 'long_answer',
  MULTIPLE_CHOICE = 'multiple_choice',
  MULTIPLE_SELECT = 'multiple_select',
  DROPDOWN = 'dropdown',
  DATE = 'date',
  TIME = 'time',
  FILE_UPLOAD = 'file_upload',
}
