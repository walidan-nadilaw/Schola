import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import { mockGuides, GuideItem } from '../../utils/guides';

export default function AdminPanduanManagement() {
  const [guides, setGuides] = useState(() => mockGuides);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSteps, setFormSteps] = useState<string[]>(['']);

  const handleEditStart = (guide: GuideItem) => {
    setEditingId(guide.id);
    setFormTitle(guide.title);
    setFormSteps([...guide.steps]);
  };

  const handleCreateStart = () => {
    setEditingId('new');
    setFormTitle('');
    setFormSteps(['']);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleStepChange = (index: number, val: string) => {
    const updated = [...formSteps];
    updated[index] = val;
    setFormSteps(updated);
  };

  const handleAddStep = () => {
    setFormSteps([...formSteps, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (formSteps.length > 1) {
      setFormSteps(formSteps.filter((_, idx) => idx !== index));
    }
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error('Judul panduan wajib diisi!');
      return;
    }
    const cleanSteps = formSteps.filter(s => s.trim() !== '');
    if (cleanSteps.length === 0) {
      toast.error('Panduan minimal harus memiliki 1 langkah isi!');
      return;
    }

    if (editingId === 'new') {
      const newGuide: GuideItem = {
        id: `G0${guides.length + 1}`,
        title: formTitle,
        steps: cleanSteps
      };
      mockGuides.push(newGuide);
    } else {
      const target = mockGuides.find(g => g.id === editingId);
      if (target) {
        target.title = formTitle;
        target.steps = cleanSteps;
      }
    }

    setGuides([...mockGuides]);
    setEditingId(null);
    toast.success('Panduan berhasil disimpan!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus panduan ini?')) {
      const idx = mockGuides.findIndex(g => g.id === id);
      if (idx >= 0) {
        mockGuides.splice(idx, 1);
        setGuides([...mockGuides]);
        toast.success('Panduan berhasil dihapus!');
      }
    }
  };

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manajemen Panduan (Admin POV)</h1>
          <p className="text-gray-600">Kelola dan update daftar panduan langkah-demi-langkah bagi mahasiswa</p>
        </div>
        {!editingId && (
          <button
            onClick={handleCreateStart}
            className="flex items-center gap-2 bg-[#007bff] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors"
          >
            <Plus size={20} />
            Tambah Panduan Baru
          </button>
        )}
      </div>

      {editingId ? (
        /* Edit or Create View */
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-3xl">
          <h2 className="text-xl font-bold mb-6 text-gray-800">
            {editingId === 'new' ? 'Buat Panduan Baru' : 'Edit Panduan'}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Judul Panduan</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Contoh: Cara Mengajukan Surat Keterangan Aktif"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007bff]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Langkah-Langkah:</label>
              <div className="space-y-3">
                {formSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#007bff] text-white flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder={`Langkah ke-${index + 1}...`}
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007bff]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                      disabled={formSteps.length === 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddStep}
                className="mt-4 flex items-center gap-2 text-[#007bff] font-bold hover:underline"
              >
                <Plus size={18} />
                Tambah Langkah baru
              </button>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-[#007bff] hover:bg-[#0056b3] text-white px-6 py-2.5 rounded-lg font-bold transition-colors"
              >
                <Save size={18} />
                Simpan
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-semibold transition-colors"
              >
                <X size={18} />
                Batal
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          {guides.map((guide) => (
            <div key={guide.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#007bff]/10 p-2 rounded text-[#007bff]">
                      <FileText size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{guide.title}</h3>
                  </div>

                  <ol className="space-y-2.5 pl-2">
                    {guide.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex gap-3 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-5 h-5 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {sIdx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditStart(guide)}
                    className="p-2 text-[#007bff] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Panduan"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(guide.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Panduan"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {guides.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 mb-4">Belum ada panduan terdaftar</p>
              <button
                onClick={handleCreateStart}
                className="bg-[#007bff] text-white px-6 py-2 rounded-lg hover:bg-[#0056b3] transition-colors"
              >
                Buat Panduan Pertama
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
