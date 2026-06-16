'use client';

import { Bell, Menu } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';

interface Props {
  userName: string;
  roleLabel: string;
  hospitalName: string;
  onMenuClick?: () => void;
}

export default function HospitalTopbar({ userName, roleLabel, hospitalName, onMenuClick }: Props) {
  const { i18n } = useTranslation();

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left: menu + hospital name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <Menu size={18} className="text-gray-600" />
        </button>
        <div className="min-w-0">
          <p className="text-base font-semibold truncate" style={{ color: '#1E3A5F' }}>{hospitalName}</p>
          <p className="text-xs text-gray-500 hidden sm:block">{roleLabel}</p>
        </div>
      </div>

      {/* Right: langs + bell + avatar — shrink-0 so it never gets squeezed */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="hidden md:flex items-center gap-1">
          {SUPPORTED_LANGUAGES.map((lang, i) => (
            <span key={lang.code} className="flex items-center">
              <button
                onClick={() => changeLanguage(lang.code)}
                className={`text-sm font-medium px-0.5 ${i18n.language === lang.code ? 'text-gray-900 font-semibold' : 'text-gray-400 hover:text-gray-700'}`}
              >
                {lang.label}
              </button>
              {i < SUPPORTED_LANGUAGES.length - 1 && <span className="text-gray-300 mx-1">|</span>}
            </span>
          ))}
        </div>

        <button className="relative p-2 rounded-full hover:bg-gray-100 shrink-0" aria-label="Notifications">
          <Bell size={18} className="text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{ backgroundColor: '#2D9B8A' }}
          >
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800">{userName}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
