import { useState, useEffect } from 'react';
import { BookOpen, FileText, Clock, CheckCircle, Download, ChevronDown, HelpCircle } from 'lucide-react';
import imgBgPageTitleScaled1 from "../../../imports/LandingPage/891b7e209714ed31573053818da4963bc230914c.png";
import { mockGuides } from '../../utils/guides';
import { api } from '../../utils/api';

interface PanduanProps {
  onAjukan?: (letterType: string) => void;
}

interface LetterTypeItem {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  processTime: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function Panduan({ onAjukan }: PanduanProps) {
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null);
  const [letterTypes, setLetterTypes] = useState<LetterTypeItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch form templates
        const templatesData = await api.get<any[]>('/templates');
        const mappedLetters = (templatesData || []).map((t) => ({
          id: t.id,
          name: t.letter_type,
          description: t.description || `Pengajuan dokumen ${t.letter_type} secara online.`,
          requirements: (t.fields || []).map((f: any) => f.label || f.name),
          processTime: '2-5 hari kerja'
        }));
        setLetterTypes(mappedLetters);

        // Fetch FAQs
        const faqsData = await api.get<any[]>('/faqs');
        setFaqs(faqsData || []);
      } catch (err) {
        console.error("Gagal memuat data panduan:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleLetter = (letterName: string) => {
    setExpandedLetter(expandedLetter === letterName ? null : letterName);
  };

  return (
    <div className="bg-white min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="relative h-[180px] overflow-hidden">
          <div className="absolute inset-0">
            <img alt="" className="absolute h-full w-full object-cover" src={imgBgPageTitleScaled1} style={{ objectPosition: 'center' }} />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
            <h1 className="font-bold text-[29.787px] text-white mb-2 animate-bounce">
              Panduan Penggunaan Schola
            </h1>
            <p className="text-[19.991px] text-white opacity-90">
              Pelajari cara menggunakan sistem IPB Academic Help Center
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Step by Step Guides */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Panduan Langkah demi Langkah</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockGuides.map((guide) => (
              <div key={guide.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#007bff] p-3 rounded-lg text-white">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-xl font-bold">{guide.title}</h3>
                </div>
                <ol className="space-y-3">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#007bff] text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {stepIndex + 1}
                      </span>
                      <span className="text-gray-700 text-sm leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Letter Types & Requirements with Dropdowns */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Jenis Surat & Persyaratan</h2>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Memuat jenis surat...</div>
          ) : letterTypes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">Belum ada jenis surat terdaftar di database.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {letterTypes.map((letter) => (
                <div key={letter.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleLetter(letter.name)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="text-[#007bff]" size={24} />
                      <div className="text-left">
                        <h3 className="font-bold text-lg">{letter.name}</h3>
                        <p className="text-sm text-gray-600">{letter.description}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`text-gray-400 transition-transform ${expandedLetter === letter.name ? 'rotate-180' : ''}`}
                      size={24}
                    />
                  </button>

                  {expandedLetter === letter.name && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-3">Persyaratan Dokumen:</p>
                          <ul className="space-y-2">
                            {letter.requirements.map((req, reqIndex) => (
                              <li key={reqIndex} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-3">Waktu Proses:</p>
                          <p className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                            <Clock className="text-[#007bff]" size={16} />
                            {letter.processTime}
                          </p>
                          <button
                            onClick={() => onAjukan?.(letter.name)}
                            className="bg-[#007bff] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition-colors flex items-center gap-2"
                          >
                            <FileText size={18} />
                            Ajukan Surat Ini
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Download Guide */}
        <div className="mb-12 bg-gradient-to-r from-[#007bff] to-[#0056b3] rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Panduan Lengkap (PDF)</h3>
              <p className="opacity-90">Download panduan lengkap penggunaan sistem Schola</p>
            </div>
            <button className="bg-white text-[#007bff] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors">
              <Download size={20} />
              Download PDF
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions (FAQ)</h2>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Memuat FAQ...</div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <HelpCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">Belum ada FAQ terdaftar di database.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details key={faq.id} className="border-b pb-4 cursor-pointer group">
                  <summary className="font-medium flex items-center justify-between">
                    <span>{faq.question}</span>
                    <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform" size={20} />
                  </summary>
                  <p className="mt-3 text-gray-600 ml-4 text-sm leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
