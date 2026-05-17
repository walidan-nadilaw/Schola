import { useState, useEffect } from 'react';
import { FileText, Upload, X, ChevronLeft } from 'lucide-react';
import StepTimeline from '../public/StepTimeline';
import DynamicFormRenderer from './DynamicFormRenderer';
import VerifierSelection from './VerifierSelection';
import { getAllFormTemplates, getFormTemplateByLetterType, saveDraft, FormDraft } from '../../utils/formTemplates';
import { SelectedVerifier } from '../../utils/users';

interface AjuanProps {
  preSelectedLetter?: string;
  editingSubmissionId?: string | null;
  onBackToList?: () => void;
}

export default function Ajuan({ preSelectedLetter, editingSubmissionId, onBackToList }: AjuanProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedVerifiers, setSelectedVerifiers] = useState<SelectedVerifier[]>([]);
  const [isOrderedVerification, setIsOrderedVerification] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [draftId] = useState(`draft-${Date.now()}`);

  const steps = ['Pilih Jenis Surat', 'Isi Form & Lampiran', 'Pilih Verifikator', 'Review & Submit'];
  const formTemplates = getAllFormTemplates();

  useEffect(() => {
    // If editing existing submission, load the data
    if (editingSubmissionId) {
      // Mock data - in real app, fetch by editingSubmissionId
      setSelectedLetter('Surat Keterangan Aktif');
      setSelectedVerifiers([
        {
          id: 'U001',
          name: 'Dr. Ahmad Santoso',
          role: 'Dosen',
          department: 'Fakultas Pertanian',
          email: 'ahmad.santoso@ipb.ac.id',
          order: 1
        }
      ]);
      setIsOrderedVerification(true);
      setFormData({
        'field-1': 'Beasiswa LPDP',
        'field-2': '6',
        'field-3': 'Untuk melanjutkan studi S2'
      });
      setCurrentStep(2); // Start at form step for editing
    } else if (preSelectedLetter) {
      setSelectedLetter(preSelectedLetter);
      if (getFormTemplateByLetterType(preSelectedLetter)) {
        setCurrentStep(2); // Go to form filling
      }
    }
  }, [preSelectedLetter, editingSubmissionId]);

  const currentTemplate = getFormTemplateByLetterType(selectedLetter);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleFileAdd = (newFiles: FileList | null) => {
    if (newFiles) {
      setFiles((prev) => [...prev, ...Array.from(newFiles)]);
    }
  };

  const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    saveDraft(new FormDraft({
      id: draftId,
      templateId: currentTemplate?.id || '',
      letterType: selectedLetter,
      verifiers: selectedVerifiers,
      isOrderedVerification,
      formData,
      attachments: files,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    alert('Draft berhasil disimpan!');
  };

  const handleFinalize = () => {
    saveDraft(new FormDraft({
      id: editingSubmissionId || draftId,
      templateId: currentTemplate?.id || '',
      letterType: selectedLetter,
      verifiers: selectedVerifiers,
      isOrderedVerification,
      formData,
      attachments: files,
      status: 'finalized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (editingSubmissionId) {
      alert('Perubahan berhasil disimpan dan dikirim ke verifikator!');
      onBackToList?.();
    } else {
      alert('Pengajuan berhasil difinalisasi dan dikirim ke verifikator!');
      // Reset form
      setCurrentStep(1);
      setSelectedLetter('');
      setSelectedVerifiers([]);
      setIsOrderedVerification(false);
      setFormData({});
      setFiles([]);
    }
  };

  const canProceedToStep2 = selectedLetter && currentTemplate;
  const canProceedToStep3 = currentTemplate && currentTemplate.fields.every(
    (field) => !field.required || formData[field.id]
  );
  const canProceedToStep4 = selectedVerifiers.length > 0;

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <h1 className="text-3xl font-bold mb-2">
        {editingSubmissionId ? 'Edit Pengajuan Surat' : 'Ajukan Surat Baru'}
      </h1>
      <p className="text-gray-600 mb-8">
        {editingSubmissionId ? 'Perbarui data pengajuan surat Anda' : 'Lengkapi formulir untuk mengajukan surat akademik'}
      </p>

      <StepTimeline currentStep={currentStep} steps={steps} />

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-4xl mx-auto">
        {/* Step 1: Choose Letter Type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block font-medium mb-2 text-lg">
                Pilih Jenis Surat <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-4 mt-4">
                {formTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedLetter(template.letterType)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedLetter === template.letterType
                        ? 'border-[#007bff] bg-blue-50'
                        : 'border-gray-200 hover:border-[#007bff]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FileText
                        className={selectedLetter === template.letterType ? 'text-[#007bff]' : 'text-gray-400'}
                        size={24}
                      />
                      <div className="flex-1">
                        <p className="font-bold">{template.letterType}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Requirements Section */}
            {selectedLetter && currentTemplate && (
              <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-lg mb-4 text-[#007bff]">Persyaratan untuk {selectedLetter}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium mb-2">Field yang perlu diisi:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {currentTemplate.fields.map((field) => (
                        <li key={field.id} className="text-sm text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                          {field.helpText && (
                            <span className="text-gray-600 text-xs ml-2">
                              ({field.helpText})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToStep2}
                className="bg-[#007bff] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Lanjut ke Isi Form
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Fill Form & Upload Documents */}
        {currentStep === 2 && currentTemplate && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-bold text-[#007bff]">Jenis Surat: {selectedLetter}</p>
            </div>

            <DynamicFormRenderer
              fields={currentTemplate.fields}
              formData={formData}
              onChange={handleFieldChange}
            />

            <div className="border-t pt-6 mt-8">
              <label className="block font-medium mb-2 text-lg">Lampiran Dokumen</label>
              <p className="text-sm text-gray-600 mb-4">Upload dokumen pendukung (opsional)</p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                <label className="cursor-pointer">
                  <Upload className="mx-auto mb-3 text-gray-400" size={40} />
                  <p className="text-gray-600 mb-1">Klik untuk upload atau drag & drop</p>
                  <p className="text-sm text-gray-500">PDF, DOC, DOCX, JPG, PNG (Maks. 5MB per file)</p>
                  <input
                    type="file"
                    onChange={(e) => handleFileAdd(e.target.files)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                  />
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="text-[#007bff]" size={24} />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#fcdde2] rounded-lg p-4 flex gap-3 mt-6">
              <div className="text-[#830000] text-2xl font-bold">!</div>
              <div>
                <p className="text-[#830000] font-bold text-sm mb-1">Perhatian</p>
                <p className="text-[#830000] text-sm">
                  Pastikan semua data yang Anda masukkan sudah benar. Anda dapat menyimpan sebagai draft dan melanjutkan nanti.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={20} />
                Kembali
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Simpan Draft
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedToStep3}
                  className="bg-[#007bff] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Lanjut ke Verifikator
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Verifiers */}
        {currentStep === 3 && currentTemplate && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-bold text-[#007bff]">Jenis Surat: {selectedLetter}</p>
            </div>

            <h2 className="text-2xl font-bold mb-4">Tentukan Verifikator</h2>
            <p className="text-gray-600 mb-6">Pilih user yang akan memverifikasi pengajuan surat Anda</p>

            <VerifierSelection
              selectedVerifiers={selectedVerifiers}
              onVerifiersChange={setSelectedVerifiers}
              isOrdered={isOrderedVerification}
              onOrderedChange={setIsOrderedVerification}
            />

            <div className="flex justify-between gap-3 mt-8">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={20} />
                Kembali
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Simpan Draft
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={!canProceedToStep4}
                  className="bg-[#007bff] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && currentTemplate && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Review Pengajuan</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-bold text-[#007bff]">Jenis Surat: {selectedLetter}</p>
            </div>

            {/* Verifiers */}
            <div className="border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4">Verifikator</h3>
              <div className="mb-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  isOrderedVerification
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {isOrderedVerification ? '🔢 Verifikasi Berurutan' : '⚡ Verifikasi Parallel'}
                </span>
              </div>
              <div className="space-y-2">
                {selectedVerifiers.map((verifier, index) => (
                  <div key={verifier.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    {isOrderedVerification && (
                      <div className="w-8 h-8 bg-[#007bff] text-white rounded-full flex items-center justify-center font-bold">
                        {verifier.order}
                      </div>
                    )}
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                      {verifier.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{verifier.name}</p>
                      <p className="text-sm text-gray-600">{verifier.role} - {verifier.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="font-bold text-lg mb-4">Data Formulir</h3>
              {currentTemplate.fields.map((field) => (
                <div key={field.id} className="border-b pb-3 last:border-0">
                  <p className="text-sm text-gray-600">{field.label}</p>
                  <p className="font-medium mt-1">
                    {Array.isArray(formData[field.id])
                      ? formData[field.id].join(', ')
                      : formData[field.id] || '-'}
                  </p>
                </div>
              ))}
            </div>

            {files.length > 0 && (
              <div className="border rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">Dokumen Lampiran</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      <FileText className="text-[#007bff]" size={24} />
                      <span>{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <div className="text-yellow-700 text-2xl font-bold">⚠</div>
              <div>
                <p className="text-yellow-700 font-bold text-sm mb-1">Konfirmasi</p>
                <p className="text-yellow-700 text-sm">
                  Setelah difinalisasi, Anda tidak dapat mengubah data pengajuan. Pastikan semua informasi sudah benar.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={20} />
                Kembali & Edit
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Simpan Draft
                </button>
                <button
                  onClick={handleFinalize}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                >
                  Finalisasi & Kirim
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
