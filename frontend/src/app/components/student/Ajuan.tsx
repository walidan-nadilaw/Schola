import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, X, ChevronLeft } from 'lucide-react';
import StepTimeline from '../public/StepTimeline';
import DynamicFormRenderer from './DynamicFormRenderer';
import VerifierSelection from './VerifierSelection';
import { fetchAllFormTemplates, FormTemplate } from '../../utils/formTemplates';
import { SelectedVerifier } from '../../utils/users';
import {
  createSubmission,
  updateSubmissionDraft,
  sendFinalizeSubmission,
  uploadAttachmentForSubmission,
  fetchSubmissionById
} from '../../utils/submissions';

interface AjuanProps {
  preSelectedLetter?: string;
  editingSubmissionId?: string | null;
  onBackToList?: () => void;
}

export default function Ajuan({ preSelectedLetter, editingSubmissionId, onBackToList }: AjuanProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedVerifiers, setSelectedVerifiers] = useState<SelectedVerifier[]>([]);
  const [isOrderedVerification, setIsOrderedVerification] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const steps = ['Pilih Jenis Surat', 'Isi Form & Lampiran', 'Pilih Verifikator', 'Review & Submit'];

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const templates = await fetchAllFormTemplates();
        setFormTemplates(templates);
      } catch (e) {
        console.error('Error fetching templates:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    const loadEditingData = async () => {
      if (editingSubmissionId) {
        setLoading(true);
        setActiveSubmissionId(editingSubmissionId);
        try {
          const sub = await fetchSubmissionById(editingSubmissionId);
          if (sub) {
            setSelectedLetter(sub.jenisSurat);
            setFormData(sub.formData);
            
            // Map verifiers back into SelectedVerifier objects
            const verifiersMapped = sub.verifiers.map((v, i) => new SelectedVerifier({
              id: v.name, // Using name as ID mapping key or index if real ID isn't directly matching
              name: v.name,
              role: v.role,
              department: 'IPB University',
              email: `${v.name.toLowerCase().replace(/[^a-z]/g, '')}@ipb.ac.id`,
              order: i + 1,
              verifierRole: v.role.toLowerCase().includes('tangan') ? 'penandatangan' : 'verifikator'
            }));
            setSelectedVerifiers(verifiersMapped);
            setIsOrderedVerification(true);
            setCurrentStep(2);
          }
        } catch (e) {
          console.error('Gagal mengambil data pengajuan:', e);
        } finally {
          setLoading(false);
        }
      } else if (preSelectedLetter) {
        setSelectedLetter(preSelectedLetter);
        const template = formTemplates.find(t => t.letterType === preSelectedLetter);
        if (template) {
          setCurrentStep(2);
        }
      }
    };
    if (formTemplates.length > 0) {
      loadEditingData();
    }
  }, [preSelectedLetter, editingSubmissionId, formTemplates]);

  const currentTemplate = formTemplates.find((t) => t.letterType === selectedLetter);

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

  const saveSubmissionState = async (): Promise<string | null> => {
    if (!currentTemplate) return null;
    setLoading(true);
    try {
      let submissionId = activeSubmissionId;
      
      // Step 1: Create clean formData without dynamic File objects for initial draft saving
      const cleanFormData: Record<string, any> = {};
      for (const key of Object.keys(formData)) {
        const val = formData[key];
        if (Array.isArray(val) && val.length > 0 && val[0] instanceof File) {
          cleanFormData[key] = [];
        } else {
          cleanFormData[key] = val;
        }
      }

      if (submissionId) {
        // Update existing draft with clean form data
        const sub = await updateSubmissionDraft(submissionId, cleanFormData, isOrderedVerification);
        submissionId = sub.id;
      } else {
        // Create new draft
        const sub = await createSubmission(currentTemplate.id, cleanFormData);
        submissionId = sub.id;
        setActiveSubmissionId(submissionId);
      }

      // Step 2: Scan and upload files inside dynamic template fields
      const finalFormData = { ...formData };
      let hasDynamicUploads = false;

      for (const field of currentTemplate.fields) {
        if (field.type === 'file_upload') {
          const val = formData[field.id];
          if (Array.isArray(val) && val.length > 0 && val[0] instanceof File) {
            hasDynamicUploads = true;
            const uploadedMeta = [];
            for (const fileObj of val) {
              const res = await uploadAttachmentForSubmission(submissionId, fileObj);
              uploadedMeta.push({
                id: res.id,
                name: fileObj.name,
                path: res.file_path || res.path
              });
            }
            finalFormData[field.id] = uploadedMeta;
          }
        }
      }

      // Step 3: If we uploaded any dynamic files, save the updated serialized formData to backend
      if (hasDynamicUploads) {
        await updateSubmissionDraft(submissionId, finalFormData, isOrderedVerification);
        setFormData(finalFormData);
      }

      return submissionId;
    } catch (e: any) {
      toast.error(`Gagal menyimpan: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    const subId = await saveSubmissionState();
    if (subId) {
      toast.success(`Draft berhasil disimpan (ID: ${subId})`);
    }
  };

  const handleFinalize = async () => {
    const subId = await saveSubmissionState();
    if (!subId) {
      toast.error('Gagal memproses pengajuan. Mohon lengkapi data dengan benar.');
      return;
    }

    setLoading(true);
    try {
      const verifiersOrder = selectedVerifiers.map((v) => v.id);
      await sendFinalizeSubmission(subId, verifiersOrder, isOrderedVerification);

      toast.success('Pengajuan berhasil difinalisasi dan dikirim ke verifikator!');
      if (onBackToList) {
        onBackToList();
      } else {
        navigate('/diajukan');
      }
    } catch (e: any) {
      toast.error(`Gagal finalisasi: ${e.message}`);
    } finally {
      setLoading(false);
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
                      ? formData[field.id].map((item: any) => typeof item === 'object' ? (item.name || item.file_name) : String(item)).join(', ')
                      : formData[field.id] || '-'}
                  </p>
                </div>
              ))}
            </div>

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
