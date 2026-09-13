import webpush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

let vapidConfigured = false;

async function withTimeout<T>(promise: Promise<T>, milliseconds: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Web Push timeout.')), milliseconds);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }
  return true;
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}

export async function sendNewOrderPush(orderNumber: string, totalAmount: number) {
  try {
    if (!configureVapid()) return false;

    const { data, error } = await getSupabaseAdmin()
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth');

    if (error) {
      console.error('Subscription push gagal dibaca:', error);
      return false;
    }

    const subscriptions = (data ?? []) as PushSubscriptionRow[];
    if (subscriptions.length === 0) return false;

    const payload = JSON.stringify({
      title: 'Pesanan baru masuk',
      body: `${orderNumber} • Rp ${Number(totalAmount).toLocaleString('id-ID')}`,
      url: '/admin',
    });

    let delivered = false;
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await withTimeout(
            webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
              },
              payload
            ),
            5_000
          );
          delivered = true;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await getSupabaseAdmin().from('push_subscriptions').delete().eq('id', subscription.id);
          } else {
            console.error('Pengiriman Web Push gagal:', error);
          }
        }
      })
    );

    return delivered;
  } catch (error) {
    console.error('Notifikasi Web Push gagal diproses:', error);
    return false;
  }
}