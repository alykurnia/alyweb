import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'IoT Lab — Interactive IoT Learning Studio',
  description:
    'Professional web-based IoT engineering workspace for students, developers, and makers to manage projects, explore microcontrollers, and architect embedded hardware systems.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white`}
      >
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
