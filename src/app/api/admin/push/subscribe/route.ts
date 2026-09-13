import { NextResponse } from 'next/server';
import { hasAdminSession, isSameOrigin } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type SubscriptionBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function parseSubscription(value: unknown): SubscriptionBody | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  const keys = body.keys;
  if (typeof body.endpoint !== 'string' || body.endpoint.length < 20 || body.endpoint.length > 2_000 || !keys || typeof keys !== 'object') return null;
  try {
    const endpoint = new URL(body.endpoint);
    if (endpoint.protocol !== 'https:') return null;
  } catch {
    return null;
  }
  const keyValues = keys as Record<string, unknown>;
  if (
    typeof keyValues.p256dh !== 'string' ||
    typeof keyValues.auth !== 'string' ||
    keyValues.p256dh.length < 20 ||
    keyValues.p256dh.length > 500 ||
    keyValues.auth.length < 8 ||
    keyValues.auth.length > 500 ||
    !/^[A-Za-z0-9_-]+$/.test(keyValues.p256dh) ||
    !/^[A-Za-z0-9_-]+$/.test(keyValues.auth)
  ) return null;
  return { endpoint: body.endpoint, keys: { p256dh: keyValues.p256dh, auth: keyValues.auth } };
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await hasAdminSession()) || !isSameOrigin(request)) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  const subscription = parseSubscription(await request.json());
  if (!subscription) return NextResponse.json({ error: 'Subscription push tidak valid.' }, { status: 400 });
  const { error } = await getSupabaseAdmin().from('push_subscriptions').upsert({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });
  if (error) {
    console.error('Subscription push gagal disimpan:', error);
    return NextResponse.json({ error: 'Subscription push gagal disimpan.' }, { status: 502 });
  }
  return NextResponse.json({ subscribed: true });
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession()) || !isSameOrigin(request)) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  const subscription = parseSubscription(await request.json());
  if (!subscription) return NextResponse.json({ error: 'Subscription push tidak valid.' }, { status: 400 });
  const { error } = await getSupabaseAdmin().from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  if (error) return NextResponse.json({ error: 'Subscription push gagal dihapus.' }, { status: 502 });
  return NextResponse.json({ subscribed: false });
}