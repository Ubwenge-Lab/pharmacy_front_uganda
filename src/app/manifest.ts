import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'E-Vuze Healthcare Platform',
    short_name: 'E-Vuze',
    description: 'Centralized healthcare management platform bridging pharmacies, hospitals, and patients.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1E4D8C',
    icons: [
      {
        src: '/E-Vuze Logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      // When Next.js builds the app, the dynamic icon.tsx and apple-icon.tsx 
      // will also automatically inject their respective PNG links into the head.
    ],
  };
}
