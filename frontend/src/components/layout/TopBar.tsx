import { useLocation } from 'react-router';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function TopBar() {
  const { user } = useAuth();
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/ajuan')) return 'Ajukan Surat Baru';
    if (path.includes('/dashboard/diajukan')) return 'Riwayat Pengajuan';
    if (path.includes('/dashboard/verifikasi')) return 'Verifikasi Pengajuan';
    if (path.includes('/dashboard/chatbot')) return 'Chatbot Bantuan';
    if (path.includes('/dashboard/submission')) return 'Detail Pengajuan';
    if (path.includes('/dashboard/admin-forms')) return 'Manajemen Template';
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/panduan') return 'Panduan';
    return '';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Title & Subtitle */}
        <div>
          <h2 className="text-xl font-bold text-gray-800">{getTitle()}</h2>
          <p className="text-sm text-gray-600 mt-1">Schola - IPB Academic Help Center</p>
        </div>

        {/* Right side — notifications + user avatar */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-[#007bff] hover:bg-blue-50 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user.nama}</p>
                <p className="text-[11px] text-gray-500">{user.displayRole}</p>
              </div>
              <div className="w-9 h-9 bg-[#007bff] rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.initials}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
