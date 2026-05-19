import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { fetchAllFormTemplates, deleteFormTemplate, FormTemplate } from '../../utils/formTemplates';
import FormBuilder from './FormBuilder';

export default function AdminFormManagement() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | undefined>(undefined);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const list = await fetchAllFormTemplates();
      setTemplates(list);
    } catch (e) {
      console.error('Gagal mengambil templates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreateNew = () => {
    setEditingTemplate(undefined);
    setShowBuilder(true);
  };

  const handleEdit = (template: FormTemplate) => {
    setEditingTemplate(template);
    setShowBuilder(true);
  };

  const handleDelete = async (templateId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      const success = await deleteFormTemplate(templateId);
      if (success) {
        alert('Template berhasil dihapus!');
        loadTemplates();
      } else {
        alert('Gagal menghapus template.');
      }
    }
  };

  const handleSave = () => {
    setShowBuilder(false);
    setEditingTemplate(undefined);
    loadTemplates();
  };

  const handleCancel = () => {
    setShowBuilder(false);
    setEditingTemplate(undefined);
  };

  if (showBuilder) {
    return <FormBuilder template={editingTemplate} onSave={handleSave} onCancel={handleCancel} />;
  }

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manajemen Template Form</h1>
          <p className="text-gray-600">Kelola template formulir untuk berbagai jenis surat</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-[#007bff] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors"
        >
          <Plus size={20} />
          Buat Template Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="text-[#007bff]" size={24} />
                  <h3 className="text-xl font-bold">{template.letterType}</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Jumlah Field</p>
                    <p className="font-medium">{template.fields.length} field</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Terakhir Diupdate</p>
                    <p className="font-medium">{new Date(template.updatedAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Dibuat Oleh</p>
                    <p className="font-medium">{template.createdBy}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-2">Field yang ada:</p>
                  <div className="flex flex-wrap gap-2">
                    {template.fields.map((field) => (
                      <span
                        key={field.id}
                        className="px-3 py-1 bg-blue-50 text-[#007bff] text-xs rounded-full"
                      >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-[#007bff] hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Template"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus Template"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-4">Belum ada template form</p>
            <button
              onClick={handleCreateNew}
              className="bg-[#007bff] text-white px-6 py-2 rounded-lg hover:bg-[#0056b3] transition-colors"
            >
              Buat Template Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
