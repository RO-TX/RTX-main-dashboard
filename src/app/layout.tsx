import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/Toaster';

const outfit = localFont({
  variable: '--font-outfit',
  display: 'swap',
  src: [
    { path: '../fonts/outfit/Outfit-Thin.woff2', weight: '100', style: 'normal' },
    { path: '../fonts/outfit/Outfit-ExtraLight.woff2', weight: '200', style: 'normal' },
    { path: '../fonts/outfit/Outfit-Light.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/outfit/Outfit-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/outfit/Outfit-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/outfit/Outfit-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/outfit/Outfit-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/outfit/Outfit-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: '../fonts/outfit/Outfit-Black.woff2', weight: '900', style: 'normal' },
  ],
});

export const metadata: Metadata = {
  title: 'RTX Admin — RO Technical Xperts',
  description: 'Official admin dashboard for RO Technical Xperts',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
