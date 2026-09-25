"use client";

import Link from 'next/link';

type AdminLoginScreenProps = {
  pinInput: string;
  isVerifying: boolean;
  onPinChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function AdminLoginScreen({ pinInput, isVerifying, onPinChange, onSubmit }: AdminLoginScreenProps) {
  return (
    <main className="admin-dashboard min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border-t-8 border-red-600">
        <h1 className="text-2xl font-black text-gray-900 mb-2 text-center">Area Terlarang</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Masukkan PIN Operasional untuk mengakses Dashboard KulkasKuliner.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Masukkan PIN"
            required
            disabled={isVerifying}
            className="w-full text-center tracking-[1em] font-black text-2xl p-4 border-2 border-gray-300 rounded-xl focus:border-red-600 focus:ring-0 outline-none disabled:bg-gray-100 disabled:opacity-50"
            value={pinInput}
            onChange={(e) => onPinChange(e.target.value)}
          />
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isVerifying ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : "Akses Sistem"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 font-semibold hover:underline">← Kembali ke Halaman Publik</Link>
        </div>
      </div>
    </main>
  );
}
