import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';

import LandingPage from './components/public/LandingPage';
import SignInPage from './components/public/SignInPage';
import Sidebar from './components/public/Sidebar';
import Beranda from './components/public/Beranda';
import Ajuan from './components/student/Ajuan';
import Diajukan from './components/student/Diajukan';
import Verifikasi from './components/verifier/Verifikasi';
import Panduan from './components/public/Panduan';
import Chatbot from './components/public/Chatbot';
import AdminFormManagement from './components/admin/AdminFormManagement';
import AdminPanduanManagement from './components/admin/AdminPanduanManagement';
import AdminFAQManagement from './components/admin/AdminFAQManagement';
import AdminSubmissions from './components/admin/AdminSubmissions';
import AdminUserManagement from './components/admin/AdminUserManagement';
import SubmissionDetail from './components/public/SubmissionDetail';
import { User } from './utils/users';
import { TOKEN_KEY, api } from './utils/api';

// ─── Auth state ───────────────────────────────────────────────
interface AuthState {
  isLoggedIn: boolean;
  currentUser: User | null;
}

function loadAuth(): AuthState {
  try {
    const saved = localStorage.getItem('currentUser');
    if (localStorage.getItem('isLoggedIn') === 'true' && saved) {
      return { isLoggedIn: true, currentUser: new User(JSON.parse(saved)) };
    }
  } catch (_) { /* ignore parse error */ }
  return { isLoggedIn: false, currentUser: null };
}

// ─── Page title map (reactive via useLocation) ─────────────────
function usePageTitle(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith('/submission/')) return 'Detail Pengajuan';
  if (pathname.startsWith('/ajuan/edit/')) return 'Edit Pengajuan';
  const titles: Record<string, string> = {
    '/beranda': 'Dashboard',
    '/ajuan': 'Ajukan Surat Baru',
    '/diajukan': 'Riwayat Pengajuan',
    '/verifikasi': 'Verifikasi Pengajuan',
    '/panduan': 'Panduan',
    '/chatbot': 'Chatbot Bantuan',
    '/admin/forms': 'Manajemen Template Form',
    '/admin/submissions': 'Semua Pengajuan',
    '/admin/panduan': 'Manajemen Panduan',
    '/admin/faq': 'Manajemen FAQ',
    '/admin/users': 'Manajemen Pengguna',
  };
  return titles[pathname] ?? 'Schola';
}

// ─── Route wrappers that use useParams ───────────────────────
function SubmissionDetailPage() {
  const params = useParams();
  const id = params["*"] || params.id;
  const navigate = useNavigate();
  return (
    <SubmissionDetail
      submissionId={decodeURIComponent(id ?? '')}
      onBack={() => navigate(-1)}
      onEdit={(sid) => navigate(`/ajuan/edit/${encodeURIComponent(sid)}`)}
    />
  );
}

function AjuanEditPage({ onBack }: { onBack: () => void }) {
  const params = useParams();
  const id = params["*"] || params.id;
  return (
    <Ajuan
      editingSubmissionId={decodeURIComponent(id ?? '')}
      onBackToList={onBack}
    />
  );
}

// ─── Authenticated shell (sidebar + topbar + routes) ──────────
function AppShell({ auth, onLogout }: { auth: AuthState; onLogout: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const title = usePageTitle();

  // Derive sidebar active key from path (e.g. "/diajukan" → "diajukan")
  const activeSidebarKey = pathname.split('/').filter(Boolean).join('/') || 'beranda';

  // Fetch notifications periodically or on notification menu click
  useEffect(() => {
    if (auth.isLoggedIn) {
      api.get<any[]>('/notifications')
        .then(data => setNotifications(data || []))
        .catch(err => console.error("Gagal mengambil notifikasi:", err));
    }
  }, [auth.isLoggedIn, showNotifications]);

  return (
    <div className="flex h-screen bg-gray-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <Sidebar
        activeSection={activeSidebarKey}
        userRole={auth.currentUser?.role ?? 'mahasiswa'}
        onSectionChange={(s) => navigate(`/${s}`)}
        onLogoClick={() => navigate('/')}
        onPanduanClick={() => navigate('/panduan')}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top bar ── */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">Schola — IPB Academic Help Center</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications bell */}
            <div className="relative">
              <button
                id="btn-notifications"
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={20} className="text-gray-600" />
                {notifications.some((n) => !n.is_read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800">Notifikasi</h3>
                      {notifications.some((n) => !n.is_read) && (
                        <button
                          onClick={async () => {
                            for (const n of notifications) {
                              if (!n.is_read) {
                                await api.post(`/notifications/${n.id}/read`).catch(() => {});
                              }
                            }
                            // Refresh list
                            api.get<any[]>('/notifications').then((data) => setNotifications(data || []));
                          }}
                          className="text-xs text-[#007bff] hover:underline font-semibold"
                        >
                          Tandai Semua Dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-500">
                          Belum ada notifikasi baru.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={async () => {
                              if (!n.is_read) {
                                await api.post(`/notifications/${n.id}/read`).catch(() => {});
                                // Refresh list
                                api.get<any[]>('/notifications').then((data) => setNotifications(data || []));
                              }
                              if (n.action_url) {
                                navigate(n.action_url);
                              }
                              setShowNotifications(false);
                            }}
                            className={`p-3 text-left hover:bg-gray-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                          >
                            <p className="text-xs text-[#007bff] font-bold uppercase mb-0.5">{n.type}</p>
                            <p className="text-sm text-gray-800 font-semibold">{n.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                            <p className="text-2xs text-gray-400 mt-1">
                              {new Date(n.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 text-center border-t border-gray-200 bg-gray-50">
                      <button onClick={() => setShowNotifications(false)} className="text-sm text-gray-600 hover:text-gray-800 font-semibold">
                        Tutup
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{auth.currentUser?.name ?? 'Pengguna'}</p>
                <p className="text-xs text-gray-500">
                  {auth.currentUser?.nim ?? auth.currentUser?.email ?? ''}
                </p>
              </div>
              <div className="w-10 h-10 bg-[#007bff] rounded-full flex items-center justify-center text-white font-bold">
                {auth.currentUser?.getInitials() ?? 'M'}
              </div>
            </div>

            <button
              id="btn-logout"
              onClick={onLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* ── Page content ── */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/beranda" element={
              <Beranda
                userRole={auth.currentUser?.role}
                onSectionChange={(s) => navigate(`/${s}`)}
                onViewSubmissionDetail={(id) => navigate(`/submission/${encodeURIComponent(id)}`)}
              />
            } />

            <Route path="/ajuan" element={<Ajuan />} />

            <Route path="/ajuan/edit/*" element={
              <AjuanEditPage onBack={() => navigate('/diajukan')} />
            } />

            <Route path="/diajukan" element={
              <Diajukan
                onNewSubmission={() => navigate('/ajuan')}
                onViewDetail={(id) => navigate(`/submission/${encodeURIComponent(id)}`)}
                onEdit={(id) => navigate(`/ajuan/edit/${encodeURIComponent(id)}`)}
              />
            } />

            <Route path="/pengajuan" element={<Navigate to="/diajukan" replace />} />

            <Route path="/submission/*" element={<SubmissionDetailPage />} />

            <Route path="/verifikasi" element={<Verifikasi />} />

            <Route path="/panduan" element={
              <div className="p-8 h-screen overflow-y-auto">
                <Panduan
                  onAjukan={(lt) => {
                    navigate('/ajuan', { state: { preSelectedLetter: lt } });
                  }}
                />
              </div>
            } />

            <Route path="/chatbot" element={<Chatbot />} />

            {/* Admin routes */}
            <Route path="/admin/forms" element={<AdminFormManagement />} />
            <Route path="/admin/submissions" element={
              <AdminSubmissions
                onViewDetail={(id) => navigate(`/submission/${encodeURIComponent(id)}`)}
              />
            } />
            <Route path="/admin/panduan" element={<AdminPanduanManagement />} />
            <Route path="/admin/faq" element={<AdminFAQManagement />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />

            {/* Catch-all: redirect to role-appropriate home */}
            <Route path="*" element={
              <Navigate to={
                auth.currentUser?.role === 'admin'
                  ? '/admin/forms'
                  : '/beranda'
              } replace />
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────
function AppContent({
  auth,
  onSignIn,
  onLogout
}: {
  auth: AuthState;
  onSignIn: (user: User) => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [showLandingPanduan, setShowLandingPanduan] = useState(false);

  return (
    <Routes>
      {/* ── Public routes ── */}
      <Route
        path="/"
        element={
          <LandingPage
            onLogin={() => navigate(auth.isLoggedIn ? '/beranda' : '/login')}
            onAjukan={(lt) => navigate(auth.isLoggedIn ? '/ajuan' : '/login', { state: { preSelectedLetter: lt } })}
            onNavigate={(section) => navigate(auth.isLoggedIn ? `/${section}` : '/login')}
            showPanduan={showLandingPanduan}
            onTogglePanduan={(val) => setShowLandingPanduan(val)}
            isLoggedIn={auth.isLoggedIn}
          />
        }
      />

      <Route
        path="/login"
        element={
          auth.isLoggedIn ? (
            <Navigate to="/beranda" replace />
          ) : (
            <SignInPage
              onSignIn={onSignIn}
              onBackToHome={() => navigate('/')}
              onNavigate={(path) => navigate(path)}
            />
          )
        }
      />

      {/* ── Protected routes — wrapped in AppShell ── */}
      <Route
        path="/*"
        element={
          auth.isLoggedIn ? (
            <AppShell auth={auth} onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const handleSignIn = (user: User) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
    setAuth({ isLoggedIn: true, currentUser: user });
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem(TOKEN_KEY);
    setAuth({ isLoggedIn: false, currentUser: null });
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <AppContent auth={auth} onSignIn={handleSignIn} onLogout={handleLogout} />
    </BrowserRouter>
  );
}