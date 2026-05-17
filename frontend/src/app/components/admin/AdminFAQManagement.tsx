import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, HelpCircle } from 'lucide-react';
import { mockFAQs, FAQItem } from '../../utils/guides';

export default function AdminFAQManagement() {
  const [faqs, setFaqs] = useState(() => mockFAQs);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');

  const handleEditStart = (faq: FAQItem) => {
    setEditingId(faq.id);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
  };

  const handleCreateStart = () => {
    setEditingId('new');
    setFormQuestion('');
    setFormAnswer('');
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formQuestion.trim() || !formAnswer.trim()) {
      alert('Pertanyaan dan Jawaban wajib diisi!');
      return;
    }

    if (editingId === 'new') {
      const newFAQ: FAQItem = {
        id: `F0${faqs.length + 1}`,
        question: formQuestion,
        answer: formAnswer
      };
      mockFAQs.push(newFAQ);
    } else {
      const target = mockFAQs.find(f => f.id === editingId);
      if (target) {
        target.question = formQuestion;
        target.answer = formAnswer;
      }
    }

    setFaqs([...mockFAQs]);
    setEditingId(null);
    alert('FAQ berhasil disimpan!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus FAQ ini?')) {
      const idx = mockFAQs.findIndex(f => f.id === id);
      if (idx >= 0) {
        mockFAQs.splice(idx, 1);
        setFaqs([...mockFAQs]);
        alert('FAQ berhasil dihapus!');
      }
    }
  };

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manajemen FAQ (Admin POV)</h1>
          <p className="text-gray-600">Kelola dan perbarui daftar Tanya Jawab (FAQ) bantuan mahasiswa</p>
        </div>
        {!editingId && (
          <button
            onClick={handleCreateStart}
            className="flex items-center gap-2 bg-[#007bff] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors"
          >
            <Plus size={20} />
            Tambah FAQ Baru
          </button>
        )}
      </div>

      {editingId ? (
        /* Edit or Create View */
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-2xl">
          <h2 className="text-xl font-bold mb-6 text-gray-800">
            {editingId === 'new' ? 'Buat FAQ Baru' : 'Edit FAQ'}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Pertanyaan</label>
              <input
                type="text"
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                placeholder="Contoh: Berapa lama durasi verifikasi berkas?"
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007bff]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Jawaban</label>
              <textarea
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                placeholder="Tuliskan jawaban penjelasan lengkap..."
                rows={5}
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007bff] resize-none"
              />
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
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-3 mb-2">
                    <HelpCircle className="text-[#007bff]" size={20} />
                    <h3 className="text-lg font-bold text-gray-800">{faq.question}</h3>
                  </div>
                  <p className="text-gray-600 text-sm pl-8 leading-relaxed">{faq.answer}</p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditStart(faq)}
                    className="p-2 text-[#007bff] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit FAQ"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus FAQ"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {faqs.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <HelpCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 mb-4">Belum ada FAQ terdaftar</p>
              <button
                onClick={handleCreateStart}
                className="bg-[#007bff] text-white px-6 py-2 rounded-lg hover:bg-[#0056b3] transition-colors"
              >
                Buat FAQ Pertama
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
