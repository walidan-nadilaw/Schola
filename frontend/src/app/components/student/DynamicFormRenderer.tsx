import { FormField } from '../../utils/formTemplates';

interface DynamicFormRendererProps {
  fields: FormField[];
  formData: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
}

export default function DynamicFormRenderer({ fields, formData, onChange }: DynamicFormRendererProps) {
  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'short_answer':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          />
        );

      case 'long_answer':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent resize-none"
          />
        );

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          >
            <option value="">Pilih...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  required={field.required}
                  className="w-4 h-4 text-[#007bff] focus:ring-[#007bff]"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_select':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v) => v !== option);
                    onChange(field.id, newValues);
                  }}
                  className="w-4 h-4 text-[#007bff] focus:ring-[#007bff] rounded"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
          />
        );

      case 'file_upload':
        return (
          <div>
            <input
              type="file"
              multiple={field.fileConfig?.maxFiles && field.fileConfig.maxFiles > 1}
              accept={field.fileConfig?.acceptedFileTypes?.join(',') || '*'}
              onChange={(e) => {
                if (e.target.files) {
                  const filesArray = Array.from(e.target.files);
                  onChange(field.id, filesArray);
                }
              }}
              required={field.required}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              {field.fileConfig?.maxFiles && `Maksimal ${field.fileConfig.maxFiles} file. `}
              {field.fileConfig?.maxSizePerFileMB && `Ukuran maksimal ${field.fileConfig.maxSizePerFileMB}MB per file. `}
              {field.fileConfig?.acceptedFileTypes && `Tipe file: ${field.fileConfig.acceptedFileTypes.join(', ')}`}
            </p>
            {Array.isArray(value) && value.length > 0 && (
              <div className="mt-2 space-y-1">
                {value.map((file: File, idx: number) => (
                  <div key={idx} className="text-sm text-gray-600">
                    📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.id}>
          <label className="block font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.helpText && (
            <p className="text-sm text-gray-500 mb-2">{field.helpText}</p>
          )}
          {renderField(field)}
        </div>
      ))}
    </div>
  );
}
