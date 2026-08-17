// frontend/src/components/shared/LoadingSpinner.tsx
// Branded loader: E-Vuze logo in a white chip, ring in brand teal/navy.
// Replaces the old purple ring — works on light and dark backgrounds.

import Image from 'next/image';

const RING: Record<string, string> = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

const CHIP: Record<string, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-11 w-11',
};

const LOGO_SIZE: Record<string, number> = {
  sm: 20,
  md: 32,
  lg: 44,
};

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex items-center justify-center" role="status" aria-label="Loading">
      <div className={`relative ${RING[size]}`}>
        {/* Spinning brand ring */}
        <div className="absolute inset-0 rounded-full animate-spin border-2 border-brand-teal/20 border-t-brand-teal" />
        {/* Soft outer halo for depth on flat backgrounds */}
        <div className="absolute -inset-1 rounded-full bg-brand-navy/5 animate-pulse" />
        {/* Logo chip */}
        <div className={`absolute inset-0 m-auto ${CHIP[size]} rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden`}>
          <Image
            src="/E-Vuze Logo.svg"
            alt="E-Vuze"
            width={LOGO_SIZE[size]}
            height={LOGO_SIZE[size]}
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
