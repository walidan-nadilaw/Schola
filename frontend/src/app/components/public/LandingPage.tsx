import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import imgImage1 from "../../../imports/LandingPage/fb4b976284f353796ffb0e836979232591a38ec0.png";
import imgDashboardLayout from "../../../imports/LandingPage/750568cbefba0fc88c5a2bf3334de13b503195fa.png";
import imgProtect from "../../../imports/LandingPage/f42a29141fc01fe878647557bfe66a578dc6f730.png";
import imgOpenBook from "../../../imports/LandingPage/01dca46ed0c13c5e30df200290dde66f8c6dbd76.png";
import imgBgPageTitleScaled1 from "../../../imports/LandingPage/891b7e209714ed31573053818da4963bc230914c.png";
import { ChevronDown } from 'lucide-react';
import Panduan from './Panduan';
import { api } from '../../utils/api';

interface LandingPageProps {
  onLogin: () => void;
  onAjukan?: (selectedLetter: string) => void;
  onNavigate?: (section: string) => void;
  showPanduan?: boolean;
  onTogglePanduan?: (show: boolean) => void;
  isLoggedIn?: boolean;
}

export default function LandingPage({
  onLogin,
  onAjukan,
  onNavigate,
  showPanduan = false,
  onTogglePanduan,
  isLoggedIn = false
}: LandingPageProps) {
  const [selectedLetter, setSelectedLetter] = useState('');
  const [templates, setTemplates] = useState<{ id: string; letter_type: string }[]>([]);
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string }[]>([]);

  useEffect(() => {
    api.get<any>('/templates/')
      .then((res) => setTemplates(res.data || []))
      .catch((err) => console.error("Gagal memuat template surat:", err));

    api.get<any>('/faqs/')
      .then((res) => setFaqs(res.data || []))
      .catch((err) => console.error("Gagal memuat FAQ:", err));
  }, []);

  return (
    <div className="bg-white min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sticky Header */}
      <div className="bg-white h-[90px] sticky top-0 z-50 border-b border-gray-100 flex items-center justify-between px-[198px] shadow-sm">
        <button
          onClick={() => onTogglePanduan?.(false)}
          className="h-[50px] w-[140px] cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img alt="Schola Logo" className="h-full w-full object-contain" src={imgImage1} />
        </button>
        <nav className="flex items-center gap-8">
          <button
            onClick={() => {
              onTogglePanduan?.(false);
              onNavigate?.('verifikasi');
            }}
            className="text-[#828282] text-[13.686px] hover:text-[#007bff] transition-colors"
          >
            Verifikasi
          </button>
          <button
            onClick={() => onTogglePanduan?.(true)}
            className={`text-[13.686px] hover:text-[#007bff] transition-colors ${
              showPanduan ? 'text-[#007bff] font-semibold' : 'text-[#828282]'
            }`}
          >
            Panduan
          </button>
          <button
            onClick={() => {
              onTogglePanduan?.(false);
              onNavigate?.('pengajuan');
            }}
            className="text-[#828282] text-[13.686px] hover:text-[#007bff] transition-colors"
          >
            Pengajuan
          </button>
          <button
            onClick={onLogin}
            className="bg-[#007bff] h-[35px] px-6 rounded-[5px] text-white text-[13.686px] hover:bg-[#0056b3] transition-colors font-normal"
          >
            {isLoggedIn ? 'Dashboard' : 'Sign In'}
          </button>
        </nav>
      </div>

      {showPanduan ? (
        /* Render Panduan inside the same landing page structure below the sticky header */
        <div className="max-w-6xl mx-auto px-[198px] py-12">
          <button
            onClick={() => onTogglePanduan?.(false)}
            className="mb-8 px-4 py-2 border-2 border-[#007bff] text-[#007bff] hover:bg-[#007bff] hover:text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2"
          >
            ← Kembali ke Beranda
          </button>
          <Panduan
            onAjukan={(letterType) => {
              onTogglePanduan?.(false);
              onAjukan?.(letterType);
            }}
          />
        </div>
      ) : (
        /* Render standard Landing Page contents */
        <>
          {/* Hero Section */}
          <div className="relative h-[262px] overflow-hidden">
            <div className="absolute inset-0">
              <img alt="" className="absolute h-full w-full object-cover" src={imgBgPageTitleScaled1} style={{ objectPosition: 'center' }} />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
              <h1 className="font-bold text-[29.787px] text-white mb-4">
                Selamat Datang di Schola: IPB Academic Help Center
              </h1>
              <p className="text-[29.787px] text-white">
                Pengajuan Surat Akademik Daring
              </p>

              {/* Search Bar */}
              <div className="flex gap-3 mt-8">
                <div className="relative">
                  <select
                    value={selectedLetter}
                    onChange={(e) => setSelectedLetter(e.target.value)}
                    className="bg-white h-[34px] w-[557px] rounded-[3px] px-4 pr-10 text-[#878787] text-[12.564px] appearance-none border border-gray-200"
                  >
                    <option value="">Pilih Jenis Surat</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.letter_type}>
                        {t.letter_type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#928C8C]" size={18} />
                </div>
                <button
                  onClick={() => {
                    if (!selectedLetter) {
                      toast.error('Silakan pilih jenis surat terlebih dahulu sebelum mengajukan!');
                      return;
                    }
                    onAjukan?.(selectedLetter);
                  }}
                  className="bg-[#007bff] h-[34px] px-6 rounded-[3px] text-white font-bold text-[12.564px] hover:bg-[#0056b3] transition-colors"
                >
                  Ajukan
                </button>
              </div>
            </div>
          </div>

          {/* Alert */}
          <div className="max-w-[549px] mx-auto mt-12 animate-pulse">
            <div className="bg-[#fcdde2] rounded-[4px] p-4 flex gap-3">
              <div className="text-[#830000] text-[50.728px] font-bold leading-none">!</div>
              <div>
                <p className="text-[#830000] font-bold text-[12.078px] mb-1">Perhatian</p>
                <p className="text-[#830000] font-light text-[12.078px]">
                  Sebelum melakukan proses pengajuan surat user dianjurkan terlebih dahulu untuk melihat panduan,
                  pastikan surat yang diajukan sesuai dengan kepentingan semestinya
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="grid grid-cols-3 gap-12">
              <button onClick={() => onNavigate?.('pengajuan')} className="text-center hover:opacity-80 transition-opacity cursor-pointer group">
                <div className="w-[100px] h-[100px] mx-auto mb-6 transform group-hover:scale-110 transition-transform">
                  <img alt="Dashboard Icon" className="w-full h-full object-contain" src={imgDashboardLayout} />
                </div>
                <h3 className="font-bold text-[29.787px] mb-4 group-hover:text-[#007bff] transition-colors">Pengajuan</h3>
                <p className="text-[#928c8c] text-[19.991px]">
                  Klik untuk melihat proses pengajuan, hasil surat yang diajukan
                </p>
              </button>

              <button onClick={() => onNavigate?.('verifikasi')} className="text-center hover:opacity-80 transition-opacity cursor-pointer group">
                <div className="w-[100px] h-[100px] mx-auto mb-6 transform group-hover:scale-110 transition-transform">
                  <img alt="Protect Icon" className="w-full h-full object-contain" src={imgProtect} />
                </div>
                <h3 className="font-bold text-[29.787px] mb-4 group-hover:text-[#007bff] transition-colors">Verifikasi Surat</h3>
                <p className="text-[#928c8c] text-[19.991px]">
                  Klik untuk menyetujui dan/atau menolak surat yang diajukan
                </p>
              </button>

              <button onClick={() => onTogglePanduan?.(true)} className="text-center hover:opacity-80 transition-opacity cursor-pointer group">
                <div className="w-[100px] h-[100px] mx-auto mb-6 transform group-hover:scale-110 transition-transform">
                  <img alt="Open Book Icon" className="w-full h-full object-contain" src={imgOpenBook} />
                </div>
                <h3 className="font-bold text-[29.787px] mb-4 group-hover:text-[#007bff] transition-colors">Panduan</h3>
                <p className="text-[#928c8c] text-[19.991px]">
                  Klik untuk melihat panduan tentang pengajuan surat daring
                </p>
              </button>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-gray-50 py-16">
            <h2 className="text-center font-bold text-[29.787px] mb-8">FAQ</h2>
            <div className="max-w-3xl mx-auto px-4 space-y-4">
              {faqs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600">Belum ada FAQ terdaftar di database.</p>
                </div>
              ) : (
                faqs.map((faq) => (
                  <details key={faq.id} className="bg-white rounded-lg p-6 cursor-pointer">
                    <summary className="font-medium text-lg">{faq.question}</summary>
                    <p className="mt-3 text-gray-600">{faq.answer}</p>
                  </details>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="bg-white h-[136px] flex items-center justify-center border-t border-gray-100">
        <p className="text-[#828282] text-[13.686px]">
          Copyright 2026 Schola: IPB Academic Help Center
        </p>
      </div>
    </div>
  );
}
