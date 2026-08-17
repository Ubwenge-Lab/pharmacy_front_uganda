'use client';

import { useEffect, useState } from 'react';

const KEY = 'evuze.sidebarCollapsed';

/**
 * Collapsible-sidebar preference, persisted per browser (localStorage).
 * Desktop-only concern — mobile keeps the off-canvas behaviour.
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved !== null) setCollapsed(saved === '1');
    } catch {
      // private mode / storage disabled — default to expanded
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return { collapsed, toggle };
}
