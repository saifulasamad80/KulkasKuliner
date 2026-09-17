import webpush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type VapidIssue = 'missing-public' | 'missing-private' | 'missing-subject' | 'bad-subject' | null;

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

/** Reads + validates the VAPID env vars, with a specific reason when they're not usable. */
export function getVapidStatus() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || '';
  const subject = process.env.VAPID_SUBJECT?.trim() || '';
  const subjectOk = /^mailto:/i.test(subject) || /^https:\/\//i.test(subject);
  let issue: VapidIssue = null;
  if (!publicKey) issue = 'missing-public';
  else if (!privateKey) issue = 'missing-private';
  else if (!subject) issue = 'missing-subject';
  else if (!subjectOk) issue = 'bad-subject';

  return { publicKey, privateKey, subject, ready: issue === null, issue };
}

function configureVapid() {
  const status = getVapidStatus();
  if (!status.ready) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(status.subject, status.publicKey, status.privateKey);
    vapidConfigured = true;
  }
  return true;
}

export function getVapidPublicKey() {
  return getVapidStatus().publicKey;
}

export async function sendNewOrderPush(orderNumber: string, totalAmount: number) {
  try {
    const vapid = getVapidStatus();
    if (!configureVapid()) {
      console.warn(
        `Notifikasi push dilewati: VAPID belum siap (${vapid.issue || 'unknown'}). Isi NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, dan VAPID_SUBJECT (mailto: atau https://).`
      );
      return false;
    }

    const { data, error } = await getSupabaseAdmin()
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth');

    if (error) {
      console.error('Subscription push gagal dibaca:', error);
      return false;
    }

    const subscriptions = (data ?? []) as PushSubscriptionRow[];
    if (subscriptions.length === 0) {
      console.warn('Notifikasi push dilewati: belum ada admin yang mengaktifkan notifikasi (0 subscription tersimpan).');
      return false;
    }

    const payload = JSON.stringify({
      title: 'Pesanan baru masuk',
      body: `${orderNumber} • Rp ${Number(totalAmount).toLocaleString('id-ID')}`,
      url: '/admin',
    });

    let delivered = false;
    let failed = 0;
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await withTimeout(
            webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
              },
              payload,
              { TTL: 86_400, urgency: 'high' }
            ),
            12_000
          );
          delivered = true;
        } catch (error) {
          failed += 1;
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await getSupabaseAdmin().from('push_subscriptions').delete().eq('id', subscription.id);
            console.warn(`Subscription push kedaluwarsa dihapus (${subscription.id}).`);
          } else {
            console.error('Pengiriman Web Push gagal:', error);
          }
        }
      })
    );

    console.log(
      `Notifikasi push: ${subscriptions.length - failed}/${subscriptions.length} perangkat admin terkirim untuk pesanan ${orderNumber}.`
    );
    return delivered;
  } catch (error) {
    console.error('Notifikasi Web Push gagal diproses:', error);
    return false;
  }
}
