import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const COOKIE_NAME = 'kulkas_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET harus berisi minimal 32 karakter.');
  }
  return secret;
}

function sign(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function pinFingerprint(pin: string) {
  return createHmac('sha256', getSessionSecret()).update(`pin:${pin}`).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionValue(pin: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin:${expiresAt}:${pinFingerprint(pin)}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidAdminSessionValue(value: string | undefined, expectedPin?: string) {
  if (!value) return false;

  const separator = value.lastIndexOf('.');
  if (separator <= 0) return false;

  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const payloadParts = payload.split(':');
  const [, expiresAtValue, fingerprint] = payloadParts;
  const expiresAt = Number(expiresAtValue);

  if (
    payloadParts.length !== 3 ||
    !payload.startsWith('admin:') ||
    !Number.isSafeInteger(expiresAt) ||
    !fingerprint ||
    (expectedPin !== undefined && !safeEqual(fingerprint, pinFingerprint(expectedPin)))
  ) {
    return false;
  }

  return expiresAt > Math.floor(Date.now() / 1000) && safeEqual(signature, sign(payload));
}

async function readExpectedAdminPin() {
  const { data, error } = await getSupabaseAdmin()
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', 'admin_secret_pin')
    .maybeSingle();

  const expectedPin = typeof data?.setting_value === 'string' ? data.setting_value.trim() : '';
  return { expectedPin, error };
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionValue || !isValidAdminSessionValue(sessionValue)) return false;

  const { expectedPin, error } = await readExpectedAdminPin();
  return !error && expectedPin.length > 0 && isValidAdminSessionValue(sessionValue, expectedPin);
}

export async function verifyAdminPin(pin: string) {
  const { expectedPin, error } = await readExpectedAdminPin();
  if (error) {
    throw new Error('PIN admin tidak dapat diverifikasi.');
  }

  return expectedPin.length > 0 && safeEqual(pin, expectedPin);
}

function withSessionCookie(response: Response, value: string, maxAgeSeconds: number) {
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Strict${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`
  );
  return new Response(response.body, { status: response.status, headers });
}

export function setAdminSessionCookie(response: Response, pin: string) {
  return withSessionCookie(response, createAdminSessionValue(pin), SESSION_TTL_SECONDS);
}

export function clearAdminSessionCookie(response: Response) {
  return withSessionCookie(response, '', 0);
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

/**
 * Guard clause for admin API routes: returns a 403 JSON Response when the
 * request lacks a valid admin session or fails the same-origin check, or
 * `null` when the request is allowed to proceed.
 *
 * Usage: `const denied = await requireAdmin(request); if (denied) return denied;`
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  if (!(await hasAdminSession()) || !isSameOrigin(request)) {
    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  }
  return null;
}

export { COOKIE_NAME };
