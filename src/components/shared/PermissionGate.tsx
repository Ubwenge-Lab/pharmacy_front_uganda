// src/components/shared/PermissionGate.tsx
//
// Conditionally renders children when the current staff member holds the
// required permission. Renders a locked fallback otherwise.
//
// Usage (hide an action button):
//   <PermissionGate permission="ADD_MEDICATION">
//     <button>Add Medication</button>
//   </PermissionGate>
//
// Usage (show inline locked notice instead of nothing):
//   <PermissionGate permission="APPROVE_PRESCRIPTIONS" showLocked>
//     <button>Approve</button>
//   </PermissionGate>

'use client';

import React from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

interface PermissionGateProps {
  /** The single permission string required to render children. */
  permission: string;
  children: React.ReactNode;
  /**
   * When true, renders a small locked badge in place of the children
   * instead of rendering nothing. Useful for inline action buttons so the
   * UI doesn't silently collapse.
   */
  showLocked?: boolean;
  /** Custom locked message. Defaults to "Permission required". */
  lockedMessage?: string;
}

export default function PermissionGate({
  permission,
  children,
  showLocked = false,
  lockedMessage = 'Permission required',
}: PermissionGateProps) {
  const { can, loading } = useStaffPermissions();

  // While loading, render children optimistically so the UI doesn't flash.
  if (loading) return <>{children}</>;

  if (can(permission)) return <>{children}</>;

  if (!showLocked) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed select-none"
      title={lockedMessage}
    >
      <LockClosedIcon className="w-3 h-3" />
      {lockedMessage}
    </span>
  );
}
