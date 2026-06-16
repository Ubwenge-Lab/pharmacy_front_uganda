'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  const { user } = useAuth();

  // Determine the correct dashboard redirect link based on the user's role
  let dashboardLink = '/login';
  let dashboardLabel = 'Back to Login';

  if (user) {
    dashboardLabel = 'Back to Dashboard';
    switch (user.role) {
      case 'PATIENT':
        dashboardLink = '/patient/dashboard';
        break;
      case 'PHARMACY':
        dashboardLink = '/pharmacy/dashboard';
        break;
      case 'SUPER_ADMIN':
        dashboardLink = '/super-admin/dashboard';
        break;
      case 'BRANCH_MANAGER':
        dashboardLink = '/branch/dashboard';
        break;
      case 'PHARMACIST':
      case 'CASHIER':
      case 'NURSE':
        dashboardLink = '/staff/dashboard';
        break;
      default:
        dashboardLink = '/';
        dashboardLabel = 'Back to Home';
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 px-6 py-12">
      <div className="text-center max-w-lg w-full">
        {/* Animated Visual */}
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="w-56 h-56 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="w-56 h-56 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          </div>
          
          <div className="relative">
            <span className="text-[140px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-teal-600 leading-none select-none">
              404
            </span>
          </div>
        </div>

        {/* Messaging */}
        <h1 className="text-3xl font-black text-gray-900 tracking-tight sm:text-4xl mb-4">
          Page Not Found
        </h1>
        <p className="text-base text-gray-500 leading-relaxed mb-10 max-w-md mx-auto">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={dashboardLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-900/10 hover:shadow-xl hover:shadow-blue-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
          >
            <HomeIcon className="w-5 h-5" />
            {dashboardLabel}
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
