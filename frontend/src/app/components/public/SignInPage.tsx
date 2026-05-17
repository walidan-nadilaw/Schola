import { useState } from 'react';
import imgHeader from "../../../imports/Signing/fb4b976284f353796ffb0e836979232591a38ec0.png";
import { User } from '../../utils/users';

interface SignInPageProps {
  onSignIn: (user: User) => void;
  onBackToHome: () => void;
  onNavigate?: (section: string) => void;
}

export default function SignInPage({ onSignIn, onBackToHome, onNavigate }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleQuickLogin = (role: 'mahasiswa' | 'verifikator' | 'admin') => {
    if (role === 'mahasiswa') {
      onSignIn(new User({
        id: 'U_STD_001',
        name: 'Naufal Akmal',
        role: 'mahasiswa',
        department: 'Ilmu Komputer',
        email: 'naufal@apps.ipb.ac.id'
      }));
    } else if (role === 'verifikator') {
      onSignIn(new User({
        id: 'U002',
        name: 'Dr. Siti Rahayu',
        role: 'verifikator',
        department: 'Departemen Agronomi',
        email: 'siti.rahayu@ipb.ac.id'
      }));
    } else {
      onSignIn(new User({
        id: 'U_ADM_001',
        name: 'Rina Kusuma (Admin)',
        role: 'admin',
        department: 'Bagian Akademik',
        email: 'rina.kusuma@ipb.ac.id'
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dynamically assign role based on email input for a standard submit flow
    const lowerEmail = email.toLowerCase();
    let assignedRole: 'mahasiswa' | 'verifikator' | 'admin' = 'mahasiswa';
    let assignedName = 'Naufal Akmal';
    let assignedId = 'U_STD_001';

    if (lowerEmail.includes('admin')) {
      assignedRole = 'admin';
      assignedName = 'Rina Kusuma (Admin)';
      assignedId = 'U_ADM_001';
    } else if (lowerEmail.includes('dosen') || lowerEmail.includes('siti') || lowerEmail.includes('ahmad') || lowerEmail.includes('budi')) {
      assignedRole = 'verifikator';
      assignedName = 'Dr. Siti Rahayu';
      assignedId = 'U002';
    }

    onSignIn(new User({
      id: assignedId,
      name: assignedName,
      role: assignedRole,
      department: assignedRole === 'admin' ? 'Bagian Akademik' : assignedRole === 'verifikator' ? 'Departemen Agronomi' : 'Ilmu Komputer',
      email: email
    }));
  };

  return (
    <div className="bg-white h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="bg-white h-[136px] border-b border-[#f3f4f6] flex items-center px-[47px]">
        <div className="w-full max-w-[1534px] mx-auto flex items-center justify-between">
          <button onClick={onBackToHome} className="h-[59.5px] w-[163px]">
            <img alt="Schola Logo" className="h-full w-full object-cover" src={imgHeader} />
          </button>
          <nav className="flex items-center gap-[45px]">
            <button
              onClick={() => onNavigate?.('verifikasi')}
              className="text-[#828282] text-[13.686px] leading-[20.529px] hover:text-[#007bff] transition-colors"
            >
              Verifikasi
            </button>
            <button
              onClick={() => onNavigate?.('panduan')}
              className="text-[#828282] text-[13.686px] leading-[20.529px] hover:text-[#007bff] transition-colors"
            >
              Panduan
            </button>
            <button
              onClick={() => onNavigate?.('pengajuan')}
              className="text-[#828282] text-[13.686px] leading-[20.529px] hover:text-[#007bff] transition-colors"
            >
              Pengajuan
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#f9fafb] flex items-center justify-center py-12">
        <div className="bg-white drop-shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] rounded-[10px] w-[448px] p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img alt="Schola Logo" className="h-[64px] w-[175.313px] object-cover" src={imgHeader} />
          </div>

          {/* Heading */}
          <h1 className="text-[28px] leading-[42px] text-black text-center mb-2">
            Selamat Datang
          </h1>

          <p className="text-[16px] leading-[24px] text-[#4a5565] text-center mb-8">
            Masuk ke Schola: IPB Academic Help Center
          </p>

          {/* Demo Accounts Panel */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm">
            <p className="font-bold text-[#007bff] mb-3 text-center flex items-center justify-center gap-1">
              🔐 Akun Demo (Masuk Cepat)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('mahasiswa')}
                className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-xs font-semibold text-gray-800 transition-all flex flex-col items-center gap-1 shadow-sm"
              >
                <span>👨‍🎓</span>
                <span>Mahasiswa</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('verifikator')}
                className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-xs font-semibold text-gray-800 transition-all flex flex-col items-center gap-1 shadow-sm"
              >
                <span>👩‍🏫</span>
                <span>Verifier</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-xs font-semibold text-gray-800 transition-all flex flex-col items-center gap-1 shadow-sm"
              >
                <span>🛠️</span>
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-[16px] leading-[24px] text-black">
                Email IPB
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@apps.ipb.ac.id"
                className="w-full h-[50px] px-4 py-3 border border-[#d1d5dc] rounded-[10px] text-[16px] text-black placeholder:text-[rgba(10,10,10,0.5)] focus:outline-none focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-[16px] leading-[24px] text-black">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full h-[50px] px-4 py-3 border border-[#d1d5dc] rounded-[10px] text-[16px] text-black placeholder:text-[rgba(10,10,10,0.5)] focus:outline-none focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-[13px] h-[13px] rounded border-gray-300 text-[#007bff] focus:ring-[#007bff]"
                />
                <span className="text-[14px] leading-[20px] text-[#4a5565]">
                  Ingat saya
                </span>
              </label>
              <a href="#forgot-password" className="text-[14px] leading-[20px] text-[#007bff] hover:underline">
                Lupa password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-[48px] bg-[#007bff] hover:bg-[#0056b3] rounded-[10px] text-white text-[16px] leading-[24px] transition-colors"
            >
              Masuk
            </button>
          </form>

          {/* Footer Text */}
          <p className="text-[14px] leading-[20px] text-[#4a5565] text-center mt-6">
            Gunakan akun IPB yang sama dengan portal akademik
          </p>

          <div className="border-t border-[#e5e7eb] mt-6 pt-6">
            <p className="text-[14px] leading-[20px] text-[#4a5565] text-center">
              Belum punya akun? <a href="#contact-admin" className="text-[#007bff] hover:underline">Hubungi admin</a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white h-[136px] border-t border-[#f3f4f6] flex items-center justify-center">
        <p className="text-[#828282] text-[13.686px] leading-[20.529px]">
          Copyright 2026 Schola: IPB Academic Help Center
        </p>
      </div>
    </div>
  );
}
