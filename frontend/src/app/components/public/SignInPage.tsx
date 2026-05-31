import { useState } from 'react';
import imgHeader from "../../../imports/Signing/fb4b976284f353796ffb0e836979232591a38ec0.png";
import { User } from '../../utils/users';
import { api, TOKEN_KEY } from '../../utils/api';

interface SignInPageProps {
  onSignIn: (user: User) => void;
  onBackToHome: () => void;
  onNavigate?: (section: string) => void;
}

export default function SignInPage({ onSignIn, onBackToHome, onNavigate }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post<any>('/auth/login', {
        email: loginEmail,
        password: loginPassword
      });
      
      const response = res.data || res;

      localStorage.setItem(TOKEN_KEY, response.token);
      
      // Map and instanciate User class
      const loggedUser = new User({
        id: response.user.id,
        name: response.user.nama || response.user.name,
        role: response.user.role === 'operator' ? 'admin' : response.user.role,
        department: response.user.department || response.user.position || 'Bagian Akademik',
        email: response.user.email,
        nim: response.user.nim,
        fakultas: response.user.fakultas,
        program: response.user.program,
        nip: response.user.nip,
        position: response.user.position
      });

      onSignIn(loggedUser);
    } catch (e: any) {
      setError(e.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'mahasiswa' | 'verifikator' | 'admin') => {
    if (role === 'mahasiswa') {
      setEmail('naufal@apps.ipb.ac.id');
      setPassword('mahasiswa123');
      performLogin('naufal@apps.ipb.ac.id', 'mahasiswa123');
    } else if (role === 'verifikator') {
      setEmail('siti.rahayu@ipb.ac.id');
      setPassword('verifier123');
      performLogin('siti.rahayu@ipb.ac.id', 'verifier123');
    } else {
      setEmail('rina.kusuma@ipb.ac.id');
      setPassword('admin123');
      performLogin('rina.kusuma@ipb.ac.id', 'admin123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
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
          <button type="button" onClick={onBackToHome} className="flex justify-center mb-8 mx-auto hover:opacity-80 transition-opacity">
            <img alt="Schola Logo" className="h-[64px] w-[175.313px] object-cover" src={imgHeader} />
          </button>

          {/* Heading */}
          <h1 className="text-[28px] leading-[42px] text-black text-center mb-2">
            Selamat Datang
          </h1>

          <p className="text-[16px] leading-[24px] text-[#4a5565] text-center mb-8">
            Masuk ke Schola: IPB Academic Help Center
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

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
              disabled={loading}
              className="w-full h-[48px] bg-[#007bff] hover:bg-[#0056b3] disabled:bg-blue-300 rounded-[10px] text-white text-[16px] leading-[24px] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                'Masuk'
              )}
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
