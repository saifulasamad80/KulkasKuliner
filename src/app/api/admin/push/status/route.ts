import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getVapidStatus } from '@/lib/push';

export const runtime = 'nodejs';

function classifyDevice(userAgent: string | null) {
  const value = userAgent || '';
  const device = /iPhone|iPad/i.test(value)
    ? 'iOS'
    : /Android/i.test(value)
      ? 'Android'
      : /Windows/i.test(value)
        ? 'Windows'
        : /Macintosh/i.test(value)
          ? 'Mac'
          : /Linux/i.test(value)
            ? 'Linux'
            : 'Perangkat lain';
  const browser = /Edg\//i.test(value)
    ? 'Edge'
    : /Chrome\//i.test(value)
      ? 'Chrome'
      : /Firefox\//i.test(value)
        ? 'Firefox'
        : /Safari\//i.test(value)
          ? 'Safari'
          : 'Browser lain';
  return `${device} · ${browser}`;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const vapid = getVapidStatus();
  const { data, error } = await getSupabaseAdmin()
    .from('push_subscriptions')
    .select('id, user_agent, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Status push gagal dibaca:', error);
    return NextResponse.json({ error: 'Status notifikasi gagal dibaca.' }, { status: 502 });
  }

  const devices = (data ?? []).map((row) => ({
    id: row.id as string,
    label: classifyDevice(typeof row.user_agent === 'string' ? row.user_agent : null),
    updatedAt: row.updated_at as string,
  }));

  return NextResponse.json(
    {
      vapidReady: vapid.ready,
      vapidIssue: vapid.issue,
      deviceCount: devices.length,
      devices,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
