import imgLogo from "@/assets/LandingPage/fb4b976284f353796ffb0e836979232591a38ec0.png";

interface SignInPageProps {
  onSignIn: () => void;
  onBackToHome: () => void;
}

export default function SignInPage({ onSignIn, onBackToHome }: SignInPageProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn();
  };

  return (
    <div className="bg-white min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="bg-white h-[136px] border-b border-gray-100 flex items-center justify-between px-[198px]">
        <button onClick={onBackToHome} className="h-[60px] w-[163px]">
          <img alt="Schola Logo" className="h-full w-full object-contain" src={imgLogo} />
        </button>
        <nav className="flex items-center gap-8">
          <a href="#verifikasi" className="text-[#828282] text-[13.686px] hover:text-[#007bff] transition-colors">Verifikasi</a>
          <a href="#panduan" className="text-[#828282] text-[13.686px] hover:text-[#007bff] transition-colors">Panduan</a>
          <a href="#pengajuan" className="text-[#828282] text-[13.686px] hover:text-[#007bff] transition-colors">Pengajuan</a>
          <div className="bg-[#007bff] h-[35px] px-6 rounded-[5px] flex items-center">
            <p className="text-white text-[13.686px]">Sign Up</p>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center pt-16">
        <h1 className="text-[25.589px] text-[#928c8c] text-center w-[384px] mb-8">
          Masuk sebagai Civitas Akademika IPB University
        </h1>

        <p className="text-[11.913px] text-[#928c8c] text-center w-[277px] mb-12">
          Masuk dengan menggunakan email atau <span className="italic">username</span> dan kata sandi
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[5px] shadow-[3px_3px_8.6px_1px_rgba(0,0,0,0.25),-3px_-3px_19px_2px_rgba(0,0,0,0.25)] p-8 w-[564px]">
          <div className="mb-6">
            <label className="block text-[13.501px] text-black mb-2">
              <span className="italic">username</span> atau email
            </label>
            <input
              type="text"
              placeholder="username atau email"
              className="w-full h-[32px] bg-[#d9d9d9] rounded-[3px] px-4 text-[13.501px] text-[#928c8c] italic placeholder:text-[#928c8c] focus:outline-none focus:ring-2 focus:ring-[#007bff]"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-[13.501px] text-black mb-2">
              kata sandi
            </label>
            <input
              type="password"
              placeholder="password"
              className="w-full h-[32px] bg-[#d9d9d9] rounded-[3px] px-4 text-[13.501px] text-[#928c8c] italic placeholder:text-[#928c8c] focus:outline-none focus:ring-2 focus:ring-[#007bff]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full h-[32px] bg-[#007bff] hover:bg-[#0056b3] rounded-[3px] text-white text-[13.501px] transition-colors"
          >
            Masuk
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <p className="text-[11.913px] text-[#928c8c] mb-2">
            Belum memiliki akun? <span className="underline cursor-pointer hover:text-[#007bff]">daftar disini</span>
          </p>
          <p className="text-[11.913px] text-[#928c8c] underline cursor-pointer hover:text-[#007bff]">
            Lupa kata sandi
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white h-[136px] flex items-center justify-center border-t border-gray-100">
        <p className="text-[#828282] text-[13.686px]">
          Copyright 2026 Schola: IPB Academic Help Center
        </p>
      </div>
    </div>
  );
}
