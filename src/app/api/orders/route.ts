import { after, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getVapidStatus, sendNewOrderPush } from '@/lib/push';
import type { CheckoutResponse, OrderSnapshotItem } from '@/lib/types';

type CheckoutItemInput = {
  id: string;
  quantity: number;
};

type CheckoutBody = {
  items: CheckoutItemInput[];
  customer: {
    name: string;
    phone: string;
    notes?: string;
  };
  address: {
    postalCode: string;
    city: string;
    district: string;
    village: string;
    street: string;
  };
};

type CreatedOrder = {
  order_number: string;
  total_amount: number;
  items: OrderSnapshotItem[];
};

export const runtime = 'nodejs';

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function parseBody(value: unknown): CheckoutBody | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  const customer = body.customer;
  const address = body.address;

  if (!customer || typeof customer !== 'object' || !address || typeof address !== 'object') {
    return null;
  }

  const customerValue = customer as Record<string, unknown>;
  const addressValue = address as Record<string, unknown>;
  const itemsValue = Array.isArray(body.items) ? body.items : [];
  const items = itemsValue.map((item): CheckoutItemInput | null => {
    if (!item || typeof item !== 'object') return null;
    const itemValue = item as Record<string, unknown>;
    const id = text(itemValue.id, 80);
    const quantity = Number(itemValue.quantity);
    return /^[0-9a-f-]{36}$/i.test(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 100
      ? { id, quantity }
      : null;
  });

  const name = text(customerValue.name, 50);
  const phone = text(customerValue.phone, 30).replace(/\D/g, '');
  const notes = text(customerValue.notes, 500);
  const postalCode = text(addressValue.postalCode, 5);
  const city = text(addressValue.city, 120);
  const district = text(addressValue.district, 120);
  const village = text(addressValue.village, 120);
  const street = text(addressValue.street, 500);

  if (
    items.length === 0 ||
    items.some((item) => item === null) ||
    new Set(items.filter((item): item is CheckoutItemInput => item !== null).map((item) => item.id)).size !== items.length ||
    !/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]{2,49}$/u.test(name) ||
    !/^(?:08\d{8,11}|628\d{8,11})$/.test(phone) ||
    !/^\d{5}$/.test(postalCode) ||
    !city ||
    !district ||
    !village ||
    !street
  ) {
    return null;
  }

  return {
    items: items as CheckoutItemInput[],
    customer: { name, phone, notes },
    address: { postalCode, city, district, village, street },
  };
}

function createOrderNumber() {
  const date = new Date();
  const datePart = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('');
  return `KUL-${datePart}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function formatOrderItemsList(items: OrderSnapshotItem[]) {
  return items
    .map((item) => `- ${item.quantity}x ${item.menu_name || item.name}${item.variant_name ? ` (${item.variant_name})` : ''} (Rp ${(item.price * item.quantity).toLocaleString('id-ID')})`)
    .join('\n');
}

function normalizeAdminPhone(value: string) {
  const phone = value.replace(/\D/g, '');
  return /^62\d{8,13}$/.test(phone) ? phone : null;
}

async function getStoreSetting(key: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .maybeSingle();
  if (error) throw error;
  return typeof data?.setting_value === 'string' ? data.setting_value.trim() : '';
}

async function sendTelegramNotification(order: CreatedOrder, customerName: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return false;

  const itemsDetail = formatOrderItemsList(order.items);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: [
          'PESANAN BARU MASUK',
          '',
          `Order ID: ${order.order_number}`,
          `Nama: ${customerName}`,
          `Total: Rp ${Number(order.total_amount).toLocaleString('id-ID')}`,
          '',
          'Detail:',
          itemsDetail,
          '',
          'Buka dashboard admin untuk memverifikasi pembayaran.',
        ].join('\n'),
      }),
    });

    if (!response.ok) {
      console.error('Notifikasi Telegram ditolak:', response.status);
      return false;
    }

    const result = (await response.json()) as { ok?: boolean };
    return result.ok === true;
  } catch (error) {
    console.error('Notifikasi Telegram gagal:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = parseBody(await request.json());
    if (!body) {
      return NextResponse.json({ error: 'Data checkout tidak valid.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const configuredPhone = await getStoreSetting('admin_wa_number');
    const adminPhone = normalizeAdminPhone(configuredPhone);
    if (!adminPhone) {
      return NextResponse.json({ error: 'Nomor WhatsApp toko belum dikonfigurasi.' }, { status: 503 });
    }

    const shippingAddress = `${body.address.street}, Kel. ${body.address.village}, Kec. ${body.address.district}, ${body.address.city}, ${body.address.postalCode}`;
    const { data, error } = await admin.rpc('create_order_atomic', {
      p_order_number: createOrderNumber(),
      p_customer_name: body.customer.name,
      p_customer_phone: body.customer.phone.startsWith('0')
        ? `62${body.customer.phone.slice(1)}`
        : body.customer.phone,
      p_shipping_address: shippingAddress,
      p_notes: body.customer.notes,
      p_items: body.items,
    });

    if (error || !data || typeof data !== 'object') {
      console.error('RPC create_order_atomic gagal:', error);
      return NextResponse.json(
        { error: 'Pesanan belum dapat direkam. Jalankan migration transaksi terlebih dahulu.' },
        { status: 503 }
      );
    }

    const order = data as CreatedOrder;
    if (!order.order_number || !Array.isArray(order.items)) {
      console.error('Respons RPC create_order_atomic tidak sesuai kontrak.');
      return NextResponse.json({ error: 'Respons order tidak valid.' }, { status: 502 });
    }

    const orderDetails = order.items
      .map((item) => `- ${item.quantity}x ${item.menu_name || item.name}${item.variant_name ? ` (${item.variant_name})` : ''} (Rp ${(item.price * item.quantity).toLocaleString('id-ID')})`)
      .join('\n');
    const notesSection = body.customer.notes
      ? `\n\n*Catatan Tambahan:*\n${body.customer.notes}`
      : '';
    const message = [
      'Halo Admin KulkasKuliner!',
      'Saya ingin memproses pesanan saya.',
      '',
      `*ORDER ID: ${order.order_number}*`,
      `*Nama:* ${body.customer.name}`,
      `*No. WA:* ${body.customer.phone}`,
      '*Alamat Pengiriman:*',
      shippingAddress,
      '',
      '*Pesanan:*',
      orderDetails,
      '',
      `*Total Belanja:* Rp ${Number(order.total_amount).toLocaleString('id-ID')}`,
      notesSection,
      '',
      'Mohon infokan ongkos kirim Instan/Sameday beserta total transfer.',
      '',
      'Terima kasih.',
    ].join('\n');
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    after(() => Promise.allSettled([
      sendNewOrderPush(order.order_number, Number(order.total_amount)),
      sendTelegramNotification(order, body.customer.name),
    ]));
    const response: CheckoutResponse = {
      orderNumber: order.order_number,
      totalAmount: Number(order.total_amount),
      whatsappUrl,
      items: order.items,
      notificationSent: getVapidStatus().ready,
    };

    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Checkout gagal:', error);
    return NextResponse.json({ error: 'Checkout gagal diproses.' }, { status: 502 });
  }
}
