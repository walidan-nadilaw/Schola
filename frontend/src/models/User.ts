import { RoleType } from '@/types/enums';
import type { IUserJSON } from '@/types/interfaces';

/**
 * Domain model representing an authenticated user.
 *
 * Demonstrates OOP principles:
 * - Encapsulation: readonly fields, computed getters
 * - Factory method: static fromJSON()
 * - Serialization: toJSON()
 */
export class User {
  public readonly id: number;
  public readonly email: string;
  public readonly nama: string;
  public readonly role: RoleType;
  public readonly createdAt: Date;

  constructor(
    id: number,
    email: string,
    nama: string,
    role: RoleType,
    createdAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.nama = nama;
    this.role = role;
    this.createdAt = createdAt;
  }

  // ─── Factory ──────────────────────────────────────────────

  /** Create a User instance from a raw JSON response */
  static fromJSON(data: IUserJSON): User {
    return new User(
      data.id,
      data.email,
      data.nama,
      data.role,
      new Date(data.created_at),
    );
  }

  /** Serialize back to JSON format */
  toJSON(): IUserJSON {
    return {
      id: this.id,
      email: this.email,
      nama: this.nama,
      role: this.role,
      created_at: this.createdAt.toISOString(),
    };
  }

  // ─── Computed Properties ──────────────────────────────────

  /** Returns the first character of the name for avatar display */
  get initials(): string {
    return this.nama
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /** Human-readable role label for display */
  get displayRole(): string {
    const roleLabels: Record<RoleType, string> = {
      [RoleType.MAHASISWA]: 'Mahasiswa',
      [RoleType.DOSEN_PEJABAT]: 'Dosen / Pejabat',
      [RoleType.OPERATOR]: 'Operator Lembaga',
    };
    return roleLabels[this.role] ?? this.role;
  }

  /** Check if user has the mahasiswa role */
  get isMahasiswa(): boolean {
    return this.role === RoleType.MAHASISWA;
  }

  /** Check if user has the dosen/pejabat role */
  get isDosenPejabat(): boolean {
    return this.role === RoleType.DOSEN_PEJABAT;
  }

  /** Check if user has the operator role */
  get isOperator(): boolean {
    return this.role === RoleType.OPERATOR;
  }
}
