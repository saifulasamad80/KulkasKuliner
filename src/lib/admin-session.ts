import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
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

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionValue() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin:${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidAdminSessionValue(value: string | undefined) {
  if (!value) return false;

  const separator = value.lastIndexOf('.');
  if (separator <= 0) return false;

  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expiresAt = Number(payload.split(':')[1]);

  if (!payload.startsWith('admin:') || !Number.isSafeInteger(expiresAt)) {
    return false;
  }

  return expiresAt > Math.floor(Date.now() / 1000) && safeEqual(signature, sign(payload));
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return isValidAdminSessionValue(cookieStore.get(COOKIE_NAME)?.value);
}

export async function verifyAdminPin(pin: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', 'admin_secret_pin')
    .maybeSingle();

  if (error) {
    throw new Error('PIN admin tidak dapat diverifikasi.');
  }

  const expectedPin = typeof data?.setting_value === 'string' ? data.setting_value : '';
  return expectedPin.length > 0 && safeEqual(pin, expectedPin);
}

export function setAdminSessionCookie(response: Response) {
  const cookieValue = createAdminSessionValue();
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${cookieValue}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Strict${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`
  );
  return new Response(response.body, { status: response.status, headers });
}

export function clearAdminSessionCookie(response: Response) {
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`
  );
  return new Response(response.body, { status: response.status, headers });
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

export { COOKIE_NAME };
