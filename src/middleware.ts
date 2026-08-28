import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization');

    if (!basicAuth) {
      return new NextResponse('Authentication Required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Secure Admin Area"' },
      });
    }

    try {
      // RESOLUSI SEC-02: Proteksi Crash akibat Header Base64 cacat
      const authValue = basicAuth.split(' ')[1];
      const decodedValue = atob(authValue);
      
      if (!decodedValue.includes(':')) {
        throw new Error("Format kredensial tidak valid");
      }

      const [user, pwd] = decodedValue.split(':');
      const validUser = process.env.ADMIN_USERNAME;
      const validPwd = process.env.ADMIN_PASSWORD;

      // Evaluasi Kredensial
      if (user === validUser && pwd === validPwd) {
        return NextResponse.next();
      }

    } catch (error) {
      // Jika terjadi manipulasi Header, jangan crash server (500), tapi tolak akses (400/401)
      return new NextResponse('Bad Authorization Payload', { status: 400 });
    }

    // RESOLUSI SEC-02 (Mitigasi Brute-Force): Jeda palsu 1.5 detik jika password salah (Tarpit)
    // Ini akan menghancurkan kecepatan Bot yang mencoba menebak password ribuan kali per detik
    await new Promise(resolve => setTimeout(resolve, 1500));

    return new NextResponse('Invalid Credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Admin Area"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};