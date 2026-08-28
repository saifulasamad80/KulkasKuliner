import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Hanya lindungi rute yang berawalan /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization');

    // Jika tidak ada otorisasi masuk, tolak mentah-mentah
    if (!basicAuth) {
      return new NextResponse('Authentication Required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Admin Area"',
        },
      });
    }

    // Dekode kredensial bawaan browser (Base64)
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // HARDCODE KREDENSIAL (Untuk UAT/MVP Only)
    // Ganti ini dengan username dan password rahasia lu
    const validUser = 'boskulkas';
    const validPwd = 'superrahasia2026';

    if (user === validUser && pwd === validPwd) {
      return NextResponse.next(); // Lolos, izinkan masuk ke halaman admin
    }

    // Jika password salah, minta lagi
    return new NextResponse('Invalid Credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Admin Area"',
      },
    });
  }

  // Biarkan rute publik (katalog, cart) lewat tanpa hambatan
  return NextResponse.next();
}

// Konfigurasi Matcher: Beritahu Next.js untuk menjalankan middleware ini HANYA di rute tertentu
// Ini menghemat memori server (tidak dijalankan saat user melihat halaman depan)
export const config = {
  matcher: ['/admin/:path*'],
};