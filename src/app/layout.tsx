// frontend/src/app/layout.tsx - Root Layout

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'react-hot-toast';
import I18nProvider from '@/components/providers/I18nProvider';

export const viewport: Viewport = {
  themeColor: '#1E4D8C',
};

export const metadata: Metadata = {
  title: 'E-Vuze Pharmacy - Healthcare at Your Fingertips',
  description: 'Order medications online from verified pharmacies in Uganda',
  icons: {
    icon: '/E-Vuze Logo.svg',
    apple: '/E-Vuze Logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body className="font-sans font-normal antialiased">
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            {children}
              <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </body>
  </html>
);
}