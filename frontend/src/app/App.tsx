import { useState } from 'react';
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
import SubmissionDetail from './components/public/SubmissionDetail';
import { User } from './utils/users';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        return new User(JSON.parse(saved));
      } catch (e) {
        return null;
      }
    }
    if (localStorage.getItem('isLoggedIn') === 'true') {
      return new User({
        id: 'U_STD_001',
        name: 'Naufal Akmal',
        role: 'mahasiswa',
        department: 'Ilmu Komputer',
        email: 'naufal@apps.ipb.ac.id'
      });
    }
    return null;
  });
  const [showSignIn, setShowSignIn] = useState(false);
  const [showPanduan, setShowPanduan] = useState(false);
  const [viewingPublicLanding, setViewingPublicLanding] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');
  const [preSelectedLetter, setPreSelectedLetter] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewingSubmissionId, setViewingSubmissionId] = useState<string | null>(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);

  const handleAjukanFromLanding = (selectedLetter: string) => {
    setPreSelectedLetter(selectedLetter);
    setShowSignIn(true);
    setActiveSection('ajuan');
  };

  const handleNavigateFromLanding = (section: string) => {
    if (section === 'panduan') {
      setShowPanduan(true);
    } else {
      setShowSignIn(true);
      setActiveSection(section);
    }
  };

  const handleSectionChange = (section: string) => {
    // Clear any active detail/edit views when navigating via sidebar
    setViewingSubmissionId(null);
    setEditingSubmissionId(null);
    setActiveSection(section);
  };

  const renderContent = () => {
    // If viewing submission detail, show detail page
    if (viewingSubmissionId) {
      return (
        <SubmissionDetail
          submissionId={viewingSubmissionId}
          onBack={() => setViewingSubmissionId(null)}
          onEdit={(id) => {
            setViewingSubmissionId(null);
            setEditingSubmissionId(id);
          }}
        />
      );
    }

    // If editing submission, show form in edit mode
    if (editingSubmissionId) {
      return (
        <Ajuan
          editingSubmissionId={editingSubmissionId}
          onBackToList={() => {
            setEditingSubmissionId(null);
            setActiveSection('diajukan');
          }}
        />
      );
    }

    switch (activeSection) {
      case 'beranda':
        return (
          <Beranda
            userRole={currentUser?.role}
            onSectionChange={(section) => {
              setViewingSubmissionId(null);
              setEditingSubmissionId(null);
              setActiveSection(section);
            }}
            onViewSubmissionDetail={(id) => setViewingSubmissionId(id)}
          />
        );
      case 'ajuan':
        return <Ajuan preSelectedLetter={preSelectedLetter} />;
      case 'pengajuan':
      case 'diajukan':
        return (
          <Diajukan
            onNewSubmission={() => {
              setActiveSection('ajuan');
              setEditingSubmissionId(null);
            }}
            onViewDetail={(id) => setViewingSubmissionId(id)}
            onEdit={(id) => setEditingSubmissionId(id)}
          />
        );
      case 'verifikasi':
        return <Verifikasi />;
      case 'panduan':
        return (
          <div className="p-8 h-screen overflow-y-auto">
            <Panduan
              onAjukan={(letterType) => {
                setPreSelectedLetter(letterType);
                setActiveSection('ajuan');
              }}
            />
          </div>
        );
      case 'chatbot':
        return <Chatbot />;
      case 'admin-forms':
        return <AdminFormManagement />;
      case 'admin-submissions':
        return <AdminSubmissions onViewDetail={(id) => setViewingSubmissionId(id)} />;
      case 'admin-panduan':
        return <AdminPanduanManagement />;
      case 'admin-faq':
        return <AdminFAQManagement />;
      default:
        return <Beranda onSectionChange={setActiveSection} />;
    }
  };

  if ((!isLoggedIn || viewingPublicLanding) && !showSignIn) {
    return (
      <LandingPage
        onLogin={() => {
          if (isLoggedIn) {
            setViewingPublicLanding(false);
          } else {
            setShowSignIn(true);
          }
        }}
        onAjukan={(letterType) => {
          if (isLoggedIn) {
            setPreSelectedLetter(letterType);
            setActiveSection('ajuan');
            setViewingPublicLanding(false);
          } else {
            handleAjukanFromLanding(letterType);
          }
        }}
        onNavigate={(section) => {
          if (isLoggedIn) {
            if (section === 'beranda') {
              setViewingPublicLanding(false);
            } else {
              setActiveSection(section);
              setViewingPublicLanding(false);
            }
          } else {
            handleNavigateFromLanding(section);
          }
        }}
        showPanduan={showPanduan}
        onTogglePanduan={(show) => setShowPanduan(show)}
        isLoggedIn={isLoggedIn}
      />
    );
  }

  if ((!isLoggedIn || viewingPublicLanding) && showSignIn) {
    return (
      <SignInPage
        onSignIn={(user) => {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('currentUser', JSON.stringify(user));
          setCurrentUser(user);
          setIsLoggedIn(true);
          setViewingPublicLanding(false);
          setShowSignIn(false);
          if (user.role === 'admin') {
            setActiveSection('admin-forms');
          } else if (user.role === 'verifikator') {
            setActiveSection('verifikasi');
          } else {
            setActiveSection('beranda');
          }
        }}
        onBackToHome={() => setShowSignIn(false)}
        onNavigate={(section) => {
          setShowSignIn(false);
          if (isLoggedIn) {
            setActiveSection(section);
            setViewingPublicLanding(false);
          } else {
            if (section === 'panduan') {
              setShowPanduan(true);
            } else {
              handleNavigateFromLanding(section);
            }
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <Sidebar
        activeSection={activeSection}
        userRole={currentUser?.role || 'mahasiswa'}
        onSectionChange={(section) => {
          setViewingPublicLanding(false);
          handleSectionChange(section);
        }}
        onLogoClick={() => {
          setViewingPublicLanding(true);
          setViewingSubmissionId(null);
          setEditingSubmissionId(null);
        }}
        onPanduanClick={() => {
          setActiveSection('panduan');
          setViewingSubmissionId(null);
          setEditingSubmissionId(null);
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {viewingSubmissionId ? 'Detail Pengajuan' :
                editingSubmissionId ? 'Edit Pengajuan' :
                activeSection === 'beranda' ? 'Dashboard' :
                activeSection === 'ajuan' ? 'Ajukan Surat Baru' :
                (activeSection === 'pengajuan' || activeSection === 'diajukan') ? 'Riwayat Pengajuan' :
                activeSection === 'verifikasi' ? 'Verifikasi Pengajuan' :
                activeSection === 'panduan' ? 'Panduan' :
                activeSection === 'chatbot' ? 'Chatbot Bantuan' :
                activeSection === 'admin-forms' ? 'Manajemen Template Form' : ''
              }
            </h2>
            <p className="text-sm text-gray-600 mt-1">Schola - IPB Academic Help Center</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <>
                  {/* Backdrop to close on click anywhere */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  ></div>

                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-bold text-lg">Notifikasi</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div
                        onClick={() => {
                          setViewingSubmissionId(null);
                          setEditingSubmissionId(null);
                          setActiveSection('diajukan');
                          setShowNotifications(false);
                        }}
                        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-[#007bff] rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">Pengajuan Surat Disetujui</p>
                            <p className="text-xs text-gray-600 mt-1">Surat Keterangan Aktif Anda telah disetujui</p>
                            <p className="text-xs text-gray-400 mt-1">2 jam yang lalu</p>
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          setViewingSubmissionId(null);
                          setEditingSubmissionId(null);
                          setActiveSection('ajuan');
                          setShowNotifications(false);
                        }}
                        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-[#007bff] rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">Dokumen Perlu Dilengkapi</p>
                            <p className="text-xs text-gray-600 mt-1">Mohon lengkapi dokumen pendukung untuk Surat Izin Penelitian</p>
                            <p className="text-xs text-gray-400 mt-1">5 jam yang lalu</p>
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          setViewingSubmissionId(null);
                          setEditingSubmissionId(null);
                          setActiveSection('ajuan');
                          setShowNotifications(false);
                        }}
                        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-700">Pengingat Deadline</p>
                            <p className="text-xs text-gray-600 mt-1">Pengajuan surat akan ditutup dalam 3 hari</p>
                            <p className="text-xs text-gray-400 mt-1">1 hari yang lalu</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 text-center border-t border-gray-200">
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-sm text-[#007bff] hover:underline"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{currentUser?.name || 'Mahasiswa Guest'}</p>
                <p className="text-xs text-gray-500">
                  {currentUser?.role === 'mahasiswa' ? 'G6401231065' : currentUser?.email || 'Guest'}
                </p>
              </div>
              <div className="w-10 h-10 bg-[#007bff] rounded-full flex items-center justify-center text-white font-bold">
                {currentUser?.getInitials() || 'M'}
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                setCurrentUser(null);
                setIsLoggedIn(false);
                setViewingPublicLanding(false);
                setShowSignIn(false);
                setViewingSubmissionId(null);
                setEditingSubmissionId(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}