import { useState } from 'react';
import { NavLink } from 'react-router';
import {
  Home,
  FileText,
  ClipboardList,
  CheckCircle,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  icon: typeof Home;
  path?: string;
  children?: { label: string; path: string }[];
}

/**
 * Sidebar navigation component — mirrors Figma Sidebar design.
 * Collapsible with nested navigation for Pengajuan submenu.
 */
export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['Pengajuan']));

  const navItems: NavItem[] = [
    { label: 'Beranda', icon: Home, path: '/dashboard' },
    {
      label: 'Pengajuan',
      icon: FileText,
      children: [
        { label: 'Ajuan', path: '/dashboard/ajuan' },
        { label: 'Diajukan', path: '/dashboard/diajukan' },
      ],
    },
    { label: 'Verifikasi', icon: CheckCircle, path: '/dashboard/verifikasi' },
    { label: 'Panduan', icon: BookOpen, path: '/panduan' },
    { label: 'Chatbot', icon: MessageSquare, path: '/dashboard/chatbot' },
  ];

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const linkBaseClass =
    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200';
  const linkActiveClass = 'bg-[#007bff] text-white shadow-md';
  const linkInactiveClass = 'text-gray-600 hover:bg-blue-50 hover:text-[#007bff]';

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col z-40 transition-all duration-300 ${
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-[#007bff] rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="text-white" size={22} />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Schola</h1>
            <p className="text-[10px] text-gray-500">IPB Academic Helper</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.children) {
            const isExpanded = expandedMenus.has(item.label) && !isCollapsed;
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`${linkBaseClass} ${linkInactiveClass} w-full justify-between`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </span>
                  {!isCollapsed && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        end
                        className={({ isActive }) =>
                          `${linkBaseClass} text-xs ${isActive ? linkActiveClass : linkInactiveClass}`
                        }
                      >
                        <ClipboardList size={16} />
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path!}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`
              }
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Collapse Toggle */}
      <div className="border-t border-gray-100 p-3 space-y-2">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 bg-[#007bff] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user.initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.nama}</p>
              <p className="text-[11px] text-gray-500 truncate">{user.displayRole}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`${linkBaseClass} ${linkInactiveClass} w-full text-red-500 hover:bg-red-50 hover:text-red-600`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
