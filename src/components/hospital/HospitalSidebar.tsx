'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Clock,
  MessageSquare,
  Pill,
  Settings,
  DollarSign,
  Building2,
  BarChart2,
  LogOut,
  X,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#38BDF8';

const DOCTOR_NAV = [
  { href: '/hospital/doctor/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/hospital/doctor/appointments',  icon: CalendarDays,    label: 'Appointments' },
  { href: '/hospital/doctor/consultations', icon: ClipboardList,   label: 'Consultations' },
  { href: '/hospital/doctor/patient',       icon: Users,           label: 'Patients' },
  { href: '/hospital/doctor/schedule',      icon: Clock,           label: 'Schedule' },
  { href: '/hospital/doctor/messages',      icon: MessageSquare,   label: 'Messages' },
  { href: '/hospital/doctor/prescription',  icon: Pill,            label: 'Prescriptions' },
  { href: '/hospital/doctor/settings',      icon: Settings,        label: 'Settings' },
];

const ADMIN_NAV = [
  { href: '/hospital/admin/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/hospital/admin/finance',     icon: DollarSign,      label: 'Finance' },
  { href: '/hospital/admin/staff',       icon: Users,           label: 'Staff' },
  { href: '/hospital/admin/departments', icon: Building2,       label: 'Departments' },
  { href: '/hospital/admin/schedule',    icon: Clock,           label: 'Schedule' },
  { href: '/hospital/admin/reports',     icon: BarChart2,       label: 'Reports' },
  { href: '/hospital/admin/settings',    icon: Settings,        label: 'Settings' },
];

interface Props {
  portalType: 'doctor' | 'admin';
  open?: boolean;
  onClose?: () => void;
}

export default function HospitalSidebar({ portalType, open = false, onClose }: Props) {
  const pathname = usePathname();
  const nav = portalType === 'doctor' ? DOCTOR_NAV : ADMIN_NAV;
  const portalLabel = portalType === 'doctor' ? 'Doctor Portal' : 'Admin Portal';

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      style={{ backgroundColor: NAVY }}
    >
      {/* Header */}
      <div className="px-6 py-7 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <p className="text-white text-2xl font-bold tracking-tight">E-Vuze</p>
          <p className="text-white/60 text-sm mt-0.5">{portalLabel}</p>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/10" aria-label="Close sidebar">
          <X size={18} className="text-white/70" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active ? 'text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              style={active ? { backgroundColor: TEAL } : {}}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 pb-5 shrink-0">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
