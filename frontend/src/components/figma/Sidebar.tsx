import { useState } from 'react';
import { Home, FileText, CheckCircle, MessageCircle, Settings, ChevronLeft, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import logoSchola from "@/assets/LandingPage/fb4b976284f353796ffb0e836979232591a38ec0.png";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogoClick?: () => void;
  onPanduanClick?: () => void;
}

export default function Sidebar({ activeSection, onSectionChange, onLogoClick, onPanduanClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['pengajuan']);

  interface MenuItem {
    id: string;
    label: string;
    icon: any;
    submenu?: { id: string; label: string }[];
    isExternal?: boolean;
  }

  const menuItems: MenuItem[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'pengajuan', label: 'Pengajuan', icon: FileText, submenu: [
      { id: 'ajuan', label: 'Ajuan Surat' },
      { id: 'diajukan', label: 'Riwayat Pengajuan' }
    ]},
    { id: 'verifikasi', label: 'Verifikasi', icon: CheckCircle },
    { id: 'panduan', label: 'Panduan', icon: BookOpen, isExternal: true },
    { id: 'chatbot', label: 'Chatbot', icon: MessageCircle },
  ];

  const adminMenuItems = [
    { id: 'admin-forms', label: 'Manajemen Form', icon: Settings },
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white h-screen border-r border-gray-200 flex flex-col transition-all duration-300`}>
      <div className="p-6 border-b border-gray-200">
        {!isCollapsed && (
          <button onClick={onLogoClick} className="cursor-pointer hover:opacity-80 transition-opacity">
            <img src={logoSchola} alt="Schola" className="h-12 w-auto object-contain" />
            <p className="text-xs text-gray-600 mt-2">Academic Help Center</p>
          </button>
        )}
        {isCollapsed && (
          <button onClick={onLogoClick} className="cursor-pointer hover:opacity-80 transition-opacity w-full flex justify-center">
            <img src={logoSchola} alt="Schola" className="h-8 w-auto object-contain" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id ||
                            (item.submenu && item.submenu.some(sub => sub.id === activeSection));
            const isExpanded = expandedMenus.includes(item.id);

            return (
              <div key={item.id} className="mb-2">
                <button
                  onClick={() => {
                    if (item.isExternal && item.id === 'panduan') {
                      onPanduanClick?.();
                    } else if (item.submenu) {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                        setExpandedMenus([item.id]);
                      } else {
                        toggleMenu(item.id);
                      }
                    } else {
                      onSectionChange(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#007bff] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.submenu && (
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      )}
                    </>
                  )}
                </button>

                {item.submenu && isExpanded && !isCollapsed && (
                  <div className="ml-12 mt-2 space-y-1">
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => onSectionChange(subItem.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                          activeSection === subItem.id
                            ? 'bg-[#007bff]/10 text-[#007bff] font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Admin Section */}
        <div className="pt-4 border-t border-gray-200">
          {!isCollapsed && (
            <p className="px-4 text-xs font-bold text-gray-500 uppercase mb-2">Admin</p>
          )}
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <div key={item.id} className="mb-2">
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#007bff] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Collapse Toggle Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Copyright 2026 Schola
          </p>
        </div>
      )}
    </div>
  );
}
