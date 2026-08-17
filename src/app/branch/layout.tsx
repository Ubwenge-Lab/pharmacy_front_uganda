'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import BranchSidebar from '@/components/branch/BranchSidebar';
import BranchTopbar from '@/components/branch/BranchTopbar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SupportBot from '@/components/shared/SupportBot';

const STANDALONE_PAGES = ['/branch/pending-approval', '/branch/change-password'];

// Counter tools (POS, Rx upload, Rx queue) are for the whole branch team —
// not just the branch manager (CTO decision, Aug 2026).
const BRANCH_PORTAL_ROLES = ['BRANCH_MANAGER', 'PHARMACIST', 'CASHIER', 'NURSE'];

export default function BranchLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed();

  useEffect(() => {
    if (loading) return;
    if (!user || !BRANCH_PORTAL_ROLES.includes(user.role)) { router.push('/login'); return; }
    const isStandalone = STANDALONE_PAGES.some(p => pathname.startsWith(p));
    // Branch-manager-only onboarding checks (staff roles skip them)
    if (user.role === 'BRANCH_MANAGER') {
      if (user.requiresPasswordChange && !isStandalone) {
        router.push('/branch/change-password');
        return;
      }
      const branchStatus = user.branchStatus;
      if ((branchStatus === 'INVITED' || branchStatus === 'PENDING') && !isStandalone) {
        router.push('/branch/pending-approval');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !BRANCH_PORTAL_ROLES.includes(user.role)) return null;

  const isStandalone = STANDALONE_PAGES.some(p => pathname.startsWith(p));
  if (isStandalone) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <BranchSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpenSupport={() => setSupportOpen(true)} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <div className={`flex-1 min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <BranchTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
      <SupportBot open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
