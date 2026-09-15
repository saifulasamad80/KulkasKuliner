import { NextResponse } from 'next/server';
import {
  clearAdminSessionCookie,
  hasAdminSession,
  isSameOrigin,
  setAdminSessionCookie,
  verifyAdminPin,
} from '@/lib/admin-session';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    { authenticated: await hasAdminSession() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const pin = typeof body?.pin === 'string' ? body.pin : '';

    if (pin.length < 4 || pin.length > 128 || !(await verifyAdminPin(pin))) {
      return NextResponse.json({ error: 'PIN tidak valid.' }, { status: 401 });
    }

    return setAdminSessionCookie(NextResponse.json({ authenticated: true }), pin);
  } catch (error) {
    console.error('Admin login gagal:', error);
    return NextResponse.json({ error: 'Login admin gagal diproses.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 403 });
  }

  return clearAdminSessionCookie(NextResponse.json({ authenticated: false }));
}
