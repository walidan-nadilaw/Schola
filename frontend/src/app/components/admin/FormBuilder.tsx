import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Save, X } from 'lucide-react';
import { FormField, FieldType, FormTemplate, createFormTemplate, updateFormTemplate } from '../../utils/formTemplates';

interface FormBuilderProps {
  template?: FormTemplate;
  onSave: () => void;
  onCancel: () => void;
}

export default function FormBuilder({ template, onSave, onCancel }: FormBuilderProps) {
  const [letterType, setLetterType] = useState(template?.letterType || '');
  const [fields, setFields] = useState<FormField[]>(() => {
    if (template?.fields && template.fields.length > 0) {
      return template.fields;
    }
    return [
      {
        id: 'field-judul',
        label: 'Judul',
        type: 'short_answer',
        required: true,
        placeholder: 'Masukkan judul pengajuan surat...'
      }
    ];
  });
  const fieldsEndRef = useRef<HTMLDivElement>(null);

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'short_answer', label: 'Jawaban Singkat' },
    { value: 'long_answer', label: 'Jawaban Panjang' },
    { value: 'multiple_choice', label: 'Pilihan Ganda' },
    { value: 'multiple_select', label: 'Multiple Select' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'date', label: 'Tanggal' },
    { value: 'time', label: 'Waktu' },
    { value: 'file_upload', label: 'Upload Dokumen' },
  ];

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: 'Pertanyaan Baru',
      type: 'short_answer',
      required: false,
    };
    setFields([...fields, newField]);

    // Auto-scroll to the new field
    setTimeout(() => {
      fieldsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    const field = fields[index];
    if (field.id === 'field-judul') {
      toast.error('Field Judul wajib ada dan tidak dapat dihapus!');
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    const options = field.options || [];
    updateField(fieldIndex, { options: [...options, `Opsi ${options.length + 1}`] });
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = fields[fieldIndex];
    const options = [...(field.options || [])];
    options[optionIndex] = value;
    updateField(fieldIndex, { options });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    const options = field.options?.filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options });
  };

  const handleSave = async () => {
    if (!letterType.trim()) {
      toast.error('Nama surat harus diisi!');
      return;
    }

    if (fields.length === 0) {
      toast.error('Minimal harus ada 1 field!');
      return;
    }

    try {
      let result;
      if (template?.id) {
        result = await updateFormTemplate(template.id, letterType, fields);
      } else {
        result = await createFormTemplate(letterType, fields);
      }

      if (result) {
        toast.success('Template berhasil disimpan!');
        onSave();
      } else {
        toast.error('Gagal menyimpan template.');
      }
    } catch (e: any) {
      toast.error(`Gagal menyimpan template: ${e.message}`);
    }
  };

  const needsOptions = (type: FieldType) => {
    return ['multiple_choice', 'multiple_select', 'dropdown'].includes(type);
  };

  const needsFileConfig = (type: FieldType) => {
    return type === 'file_upload';
  };

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {template ? 'Edit Template Form' : 'Buat Template Form Baru'}
          </h1>
          <p className="text-gray-600">Buat formulir dinamis untuk jenis surat tertentu</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-4xl">
        {/* Letter Type */}
        <div className="mb-8">
          <label className="block font-bold text-lg mb-2">
            Nama Jenis Surat <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={letterType}
            onChange={(e) => setLetterType(e.target.value)}
            placeholder="Contoh: Surat Keterangan Aktif"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          />
        </div>

        {/* Fields */}
        <div className="space-y-6 mb-8 relative">
          <div className="flex items-center justify-between sticky top-0 bg-white z-10 py-4 -mt-4">
            <h2 className="font-bold text-lg">Field Formulir</h2>
            <button
              onClick={addField}
              className="flex items-center gap-2 bg-[#007bff] text-white px-4 py-2 rounded-lg hover:bg-[#0056b3] transition-colors shadow-lg"
            >
              <Plus size={20} />
              Tambah Field
            </button>
          </div>

          {fields.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">Belum ada field. Klik "Tambah Field" untuk memulai.</p>
            </div>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="flex items-start gap-4">
                <GripVertical className="text-gray-400 mt-3 cursor-move" size={20} />

                <div className="flex-1 space-y-4">
                  {/* Field Label */}
                  <div>
                    <label className="block font-medium mb-2">Label Pertanyaan</label>
                    <input
                      type="text"
                      value={field.label}
                      disabled={field.id === 'field-judul'}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  {/* Field Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-2">Tipe Field</label>
                      <select
                        value={field.type}
                        disabled={field.id === 'field-judul'}
                        onChange={(e) => {
                          const newType = e.target.value as FieldType;
                          const updates: Partial<FormField> = { type: newType };

                          // Clear options if switching away from option-based types
                          if (!needsOptions(newType)) {
                            updates.options = undefined;
                          }

                          // Initialize file config for file_upload type
                          if (needsFileConfig(newType) && !field.fileConfig) {
                            updates.fileConfig = {
                              maxFiles: 1,
                              maxSizePerFileMB: 5,
                              acceptedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
                            };
                          } else if (!needsFileConfig(newType)) {
                            updates.fileConfig = undefined;
                          }

                          updateField(index, updates);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        {fieldTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          disabled={field.id === 'field-judul'}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="w-4 h-4 text-[#007bff] focus:ring-[#007bff] rounded disabled:opacity-50"
                        />
                        <span className="font-medium">Wajib diisi</span>
                      </label>
                    </div>
                  </div>

                  {/* Placeholder */}
                  {(field.type === 'short_answer' || field.type === 'long_answer') && (
                    <div>
                      <label className="block font-medium mb-2">Placeholder (opsional)</label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff]"
                      />
                    </div>
                  )}

                  {/* Help Text */}
                  <div>
                    <label className="block font-medium mb-2">Teks Bantuan (opsional)</label>
                    <input
                      type="text"
                      value={field.helpText || ''}
                      onChange={(e) => updateField(index, { helpText: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff]"
                    />
                  </div>

                  {/* Options for multiple choice, dropdown, etc */}
                  {needsOptions(field.type) && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block font-medium">Opsi</label>
                        <button
                          onClick={() => addOption(index)}
                          className="text-sm text-[#007bff] hover:underline"
                        >
                          + Tambah Opsi
                        </button>
                      </div>
                      <div className="space-y-2">
                        {field.options?.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optIdx, e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff]"
                            />
                            <button
                              onClick={() => removeOption(index, optIdx)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Upload Configuration */}
                  {needsFileConfig(field.type) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <label className="block font-medium mb-3">Konfigurasi Upload File</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm mb-1">Maksimal Jumlah File</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={field.fileConfig?.maxFiles || 1}
                            onChange={(e) => updateField(index, {
                              fileConfig: {
                                ...field.fileConfig,
                                maxFiles: parseInt(e.target.value) || 1
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Maksimal Ukuran (MB per file)</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={field.fileConfig?.maxSizePerFileMB || 5}
                            onChange={(e) => updateField(index, {
                              fileConfig: {
                                ...field.fileConfig,
                                maxSizePerFileMB: parseInt(e.target.value) || 5
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff]"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm mb-1">Tipe File yang Diterima</label>
                        <input
                          type="text"
                          value={field.fileConfig?.acceptedFileTypes?.join(', ') || ''}
                          onChange={(e) => updateField(index, {
                            fileConfig: {
                              ...field.fileConfig,
                              acceptedFileTypes: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                            }
                          })}
                          placeholder=".pdf, .doc, .docx, .jpg, .png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff]"
                        />
                        <p className="text-xs text-gray-600 mt-1">Pisahkan dengan koma (contoh: .pdf, .doc, .jpg)</p>
                      </div>
                    </div>
                  )}
                </div>

                {field.id !== 'field-judul' && (
                  <button
                    onClick={() => removeField(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={fieldsEndRef} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#007bff] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors"
          >
            <Save size={20} />
            Simpan Template
          </button>
        </div>
      </div>
    </div>
  );
}
