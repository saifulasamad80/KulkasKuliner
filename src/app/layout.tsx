import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// INJEKSI WARNA TEMA HP (FOODDASH RED)
export const viewport: Viewport = {
  themeColor: '#DC2626',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://kulkaskuliner.vercel.app'),
  title: "KulkasKuliner | Agen Frozen Food Premium Jakarta Timur",
  description: "Distributor Frozen Food Premium & Praktis. Solusi bekal keluarga dan stok dapur harian Anda. Pesan sekarang, kurir instan langsung jalan!",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "KulkasKuliner Jakarta Timur",
    description: "Sedia Pempek, Durian, Bebek Bumbu Hitam, dan aneka Frozen Food premium. Siap antar Instan/Sameday!",
    url: "https://kulkaskuliner.vercel.app",
    siteName: "KulkasKuliner",
    images: [
      {
        // WhatsApp lebih konsisten membaca gambar Open Graph landscape 1.91:1.
        // Query version memaksa crawler mengambil preview baru, bukan cache lama.
        url: "/og-image.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "Katalog KulkasKuliner",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KulkasKuliner Jakarta Timur",
    description: "Sedia aneka Frozen Food premium. Siap antar Instan!",
    images: ["/og-image.jpg?v=2"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col bg-white">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
