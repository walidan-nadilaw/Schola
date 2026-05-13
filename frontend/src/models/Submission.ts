import { SubmissionStatus, VerificationStatus } from '@/types/enums';
import type { ISubmissionJSON, IVerifierJSON, IAttachmentJSON } from '@/types/interfaces';

/**
 * Domain model for a verification step within a submission.
 */
export class Verifier {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly role: string,
    public readonly department: string,
    public readonly email: string,
    public readonly order?: number,
    public readonly verifierRole?: string,
    public readonly status: VerificationStatus = VerificationStatus.PENDING,
    public readonly verifiedAt?: Date,
  ) {}

  static fromJSON(data: IVerifierJSON): Verifier {
    return new Verifier(
      data.id,
      data.name,
      data.role,
      data.department,
      data.email,
      data.order,
      data.verifier_role,
      (data.status as VerificationStatus) ?? VerificationStatus.PENDING,
      data.verified_at ? new Date(data.verified_at) : undefined,
    );
  }

  get initials(): string {
    return this.name.charAt(0).toUpperCase();
  }

  get isVerified(): boolean {
    return this.status === VerificationStatus.VERIFIED;
  }
}

/**
 * Domain model for a file attachment.
 */
export class Attachment {
  constructor(
    public readonly id: string,
    public readonly filename: string,
    public readonly size: string,
    public readonly url?: string,
  ) {}

  static fromJSON(data: IAttachmentJSON): Attachment {
    return new Attachment(data.id, data.filename, data.size, data.url);
  }
}

/**
 * Domain model representing a letter submission.
 *
 * OOP principles:
 * - Composition: contains Verifier[] and Attachment[] objects
 * - Encapsulation: status logic encapsulated in computed getters
 * - Factory: static fromJSON()
 */
export class Submission {
  constructor(
    public readonly id: string,
    public readonly jenisSurat: string,
    public readonly keperluan: string,
    public readonly tanggalPengajuan: Date,
    public readonly status: SubmissionStatus,
    public readonly formData: Record<string, unknown>,
    public readonly verifiers: Verifier[],
    public readonly attachments: Attachment[],
    public readonly submitterName: string,
    public readonly submitterNim: string,
    public readonly tanggalVerifikasi?: Date,
    public readonly keteranganVerifikator?: string,
  ) {}

  // ─── Factory ──────────────────────────────────────────────

  static fromJSON(data: ISubmissionJSON): Submission {
    return new Submission(
      data.id,
      data.jenis_surat,
      data.keperluan,
      new Date(data.tanggal_pengajuan),
      data.status,
      data.form_data,
      data.verifiers.map(Verifier.fromJSON),
      data.attachments.map(Attachment.fromJSON),
      data.submitter_name,
      data.submitter_nim,
      data.tanggal_verifikasi ? new Date(data.tanggal_verifikasi) : undefined,
      data.keterangan_verifikator,
    );
  }

  // ─── Computed Properties ──────────────────────────────────

  get isDraft(): boolean {
    return this.status === SubmissionStatus.DRAFT;
  }

  get isPending(): boolean {
    return this.status === SubmissionStatus.PENDING;
  }

  get isApproved(): boolean {
    return this.status === SubmissionStatus.APPROVED;
  }

  get isRejected(): boolean {
    return this.status === SubmissionStatus.REJECTED;
  }

  /** Whether this submission can be edited */
  get isEditable(): boolean {
    return this.isDraft || this.isRejected;
  }

  /** Whether a PDF can be downloaded (verified version) */
  get isDownloadable(): boolean {
    return this.isApproved;
  }

  /** Number of verifiers who have completed verification */
  get verifiedCount(): number {
    return this.verifiers.filter((v) => v.isVerified).length;
  }

  /** Verification progress as a percentage (0–100) */
  get verificationProgress(): number {
    if (this.verifiers.length === 0) return 0;
    return Math.round((this.verifiedCount / this.verifiers.length) * 100);
  }

  /** CSS class for the status badge */
  get statusColorClass(): string {
    const colorMap: Record<SubmissionStatus, string> = {
      [SubmissionStatus.APPROVED]: 'bg-green-100 text-green-700',
      [SubmissionStatus.REJECTED]: 'bg-red-100 text-red-700',
      [SubmissionStatus.DRAFT]: 'bg-gray-100 text-gray-700',
      [SubmissionStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
    };
    return colorMap[this.status] ?? 'bg-gray-100 text-gray-700';
  }

  /** Formatted submission date */
  get formattedDate(): string {
    return this.tanggalPengajuan.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
