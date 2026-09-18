import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Admin | KulkasKuliner',
  manifest: '/admin-manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Dashboard Admin',
    statusBarStyle: 'black-translucent',
  },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}