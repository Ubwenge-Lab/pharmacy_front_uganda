'use client';

import { useState } from 'react';
import { Settings, CheckCircle, Pencil } from 'lucide-react';

const NAVY     = '#1E3A5F';
const TEAL     = '#38BDF8';
const GRADIENT = 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)';

const mockDoctor = {
  name:          'Dr. Charles Edwin',
  initials:      'CE',
  role:          'Doctor',
  email:         'charlesedwin@gmail.com',
  phone:         '+250789374753',
  hospital:      'La crois de sud',
  specialization:'Dentist',
  licenseNumber: 'xxxx-xxxx-xxxx',
  workingHours:  '10 AM - 5PM',
  status:        'APPROVED' as const,
};

type Tab = 'profile' | 'department' | 'changePassword';

/* shared input class — min 44px height, high-contrast label */
const inputCls =
  'w-full border border-gray-200 rounded-xl px-4 text-sm text-gray-700 outline-none ' +
  'focus:ring-2 disabled:bg-white disabled:text-gray-600 transition-all ' +
  'min-h-11';

const labelCls = 'block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2';

export default function HospitalDoctorSettingsPage() {
  const [activeTab,      setActiveTab]      = useState<Tab>('profile');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm,    setProfileForm]    = useState({
    fullName:       mockDoctor.name,
    email:          mockDoctor.email,
    phone:          mockDoctor.phone,
    specialization: mockDoctor.specialization,
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile',        label: 'Profile' },
    { key: 'department',     label: 'Department' },
    { key: 'changePassword', label: 'Change Password' },
  ];

  return (
    <div className="space-y-8">

      {/* ── Hero header ── */}
      <div
        className="rounded-2xl px-6 sm:px-10 py-8 sm:py-10 flex items-center justify-between"
        style={{ background: '#EBF5FF' }}
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: NAVY }}>Settings</h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: TEAL }}>
            Manage your account and preferences
          </p>
        </div>
        <div className="relative opacity-20 shrink-0" style={{ color: NAVY }}>
          <Settings size={72} />
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
            <Pencil size={20} style={{ color: NAVY }} />
          </div>
        </div>
      </div>

      {/* ── Tabs — scrollable so "Change Password" never wraps ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="shrink-0 whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all min-h-[38px]"
            style={
              activeTab === tab.key
                ? { background: GRADIENT, color: '#fff' }
                : { background: '#fff', color: '#6b7280', border: '1px solid #d1d5db' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Body — stacks vertically on mobile, side-by-side on lg+ ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Doctor card */}
        <div className="w-full lg:w-72 lg:shrink-0 bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-7 flex flex-col items-center text-center">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mb-4"
            style={{ background: GRADIENT }}
          >
            {mockDoctor.initials}
          </div>
          <p className="font-bold text-base sm:text-lg" style={{ color: NAVY }}>{mockDoctor.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{mockDoctor.role}</p>

          <div className="w-full border-t border-gray-100 my-5" />

          <div className="w-full text-left space-y-4">
            {[
              { label: 'Email',        value: mockDoctor.email,   extra: 'break-all' },
              { label: 'Phone Number', value: mockDoctor.phone,   extra: '' },
              { label: 'Hospital',     value: mockDoctor.hospital, teal: true },
            ].map(({ label, value, extra, teal }) => (
              <div key={label}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p
                  className={`text-sm ${extra} ${teal ? 'font-semibold' : 'text-gray-700'}`}
                  style={teal ? { color: TEAL } : {}}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 w-full space-y-6">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold" style={{ color: NAVY }}>Profile Information</h2>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 min-h-11"
                  style={{ background: GRADIENT }}
                >
                  <Pencil size={14} />
                  {editingProfile ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {/* 1-col on mobile, 2-col on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Full Name',      key: 'fullName'       as const },
                  { label: 'Email',          key: 'email'          as const },
                  { label: 'Phone Number',   key: 'phone'          as const },
                  { label: 'Specialization', key: 'specialization' as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input
                      type="text"
                      value={profileForm[key]}
                      disabled={!editingProfile}
                      onChange={(e) => setProfileForm((p) => ({ ...p, [key]: e.target.value }))}
                      className={inputCls}
                      style={{ '--tw-ring-color': TEAL } as React.CSSProperties}
                    />
                  </div>
                ))}
              </div>

              {editingProfile && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="w-full sm:w-auto px-8 min-h-11 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                    style={{ background: GRADIENT }}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DEPARTMENT TAB */}
          {activeTab === 'department' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold" style={{ color: NAVY }}>Department Details</h2>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                  <CheckCircle size={15} />
                  APPROVED
                </span>
              </div>
              <div className="space-y-5">
                {[
                  { label: 'Specialization', value: mockDoctor.specialization },
                  { label: 'License number', value: mockDoctor.licenseNumber },
                  { label: 'Hospital',       value: mockDoctor.hospital },
                  { label: 'Working hours',  value: mockDoctor.workingHours },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-sm">
                    <span className="sm:w-40 text-gray-500 font-medium shrink-0">{label}</span>
                    <span className="font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHANGE PASSWORD TAB */}
          {activeTab === 'changePassword' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
              <h2 className="text-base font-bold mb-6" style={{ color: NAVY }}>Change Password</h2>
              <div className="space-y-5">
                {[
                  { label: 'Current Password',    key: 'current' as const },
                  { label: 'New Password',         key: 'newPass' as const },
                  { label: 'Confirm New Password', key: 'confirm' as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input
                      type="password"
                      value={passwordForm[key]}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
                      className={inputCls}
                      style={{ '--tw-ring-color': TEAL } as React.CSSProperties}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-7">
                {/* Full-width on mobile, auto-width on sm+ */}
                <button
                  className="w-full sm:w-auto sm:px-10 min-h-11 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                  style={{ background: GRADIENT }}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
