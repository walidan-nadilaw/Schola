import { FieldType } from '@/types/enums';
import type { IFormFieldJSON, IFormTemplateJSON, IFileUploadConfig } from '@/types/interfaces';

/**
 * Domain model for a single form field definition.
 */
export class FormField {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly type: FieldType,
    public readonly required: boolean,
    public readonly options?: string[],
    public readonly placeholder?: string,
    public readonly helpText?: string,
    public readonly fileConfig?: IFileUploadConfig,
  ) {}

  static fromJSON(data: IFormFieldJSON): FormField {
    return new FormField(
      data.id,
      data.label,
      data.type,
      data.required,
      data.options,
      data.placeholder,
      data.help_text,
      data.file_config,
    );
  }

  /** Whether this field type requires option values */
  get needsOptions(): boolean {
    return [
      FieldType.MULTIPLE_CHOICE,
      FieldType.MULTIPLE_SELECT,
      FieldType.DROPDOWN,
    ].includes(this.type);
  }

  /** Whether this field type requires file upload config */
  get needsFileConfig(): boolean {
    return this.type === FieldType.FILE_UPLOAD;
  }

  /** Human-readable field type label */
  get typeLabel(): string {
    const labels: Record<FieldType, string> = {
      [FieldType.SHORT_ANSWER]: 'Jawaban Singkat',
      [FieldType.LONG_ANSWER]: 'Jawaban Panjang',
      [FieldType.MULTIPLE_CHOICE]: 'Pilihan Ganda',
      [FieldType.MULTIPLE_SELECT]: 'Multiple Select',
      [FieldType.DROPDOWN]: 'Dropdown',
      [FieldType.DATE]: 'Tanggal',
      [FieldType.TIME]: 'Waktu',
      [FieldType.FILE_UPLOAD]: 'Upload Dokumen',
    };
    return labels[this.type] ?? this.type;
  }
}

/**
 * Domain model for a letter form template.
 *
 * OOP principles:
 * - Composition: contains FormField[] objects
 * - Factory: static fromJSON()
 */
export class FormTemplate {
  constructor(
    public readonly id: string,
    public readonly letterType: string,
    public readonly fields: FormField[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string,
  ) {}

  static fromJSON(data: IFormTemplateJSON): FormTemplate {
    return new FormTemplate(
      data.id,
      data.letter_type,
      data.fields.map(FormField.fromJSON),
      new Date(data.created_at),
      new Date(data.updated_at),
      data.created_by,
    );
  }

  /** Number of fields in the template */
  get fieldCount(): number {
    return this.fields.length;
  }

  /** Number of required fields */
  get requiredFieldCount(): number {
    return this.fields.filter((f) => f.required).length;
  }

  /** Validate that all required fields have values */
  validateFormData(data: Record<string, unknown>): boolean {
    return this.fields
      .filter((f) => f.required)
      .every((f) => data[f.id] !== undefined && data[f.id] !== '');
  }

  /** Get missing required fields */
  getMissingFields(data: Record<string, unknown>): FormField[] {
    return this.fields.filter(
      (f) => f.required && (data[f.id] === undefined || data[f.id] === ''),
    );
  }
}
