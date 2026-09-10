import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type TelegramCallbackRequest = {
  callback_query?: {
    id?: string;
    data?: string;
    message?: {
      chat?: { id?: number | string };
      message_id?: number;
      text?: string;
    };
  };
};

export const runtime = 'nodejs';

function responseMessage(value: unknown) {
  if (!value || typeof value !== 'object') return 'Perintah selesai.';
  const result = value as Record<string, unknown>;
  return typeof result.status === 'string' ? `Status: ${result.status}` : 'Perintah selesai.';
}

async function telegramCall(botToken: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Telegram ${method} gagal: ${response.status}`);
  }

  const data = (await response.json()) as { ok?: boolean };
  if (data.ok !== true) throw new Error(`Telegram ${method} menolak request.`);
}

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = request.headers.get('x-telegram-bot-api-secret-token');

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as TelegramCallbackRequest;
    const callbackQuery = body.callback_query;
    const callbackData = callbackQuery?.data ?? '';
    const callbackId = callbackQuery?.id;
    const chatId = callbackQuery?.message?.chat?.id;
    const messageId = callbackQuery?.message?.message_id;

    if (!callbackQuery || !callbackId || chatId === undefined || messageId === undefined) {
      return NextResponse.json({ message: 'Abaikan, payload bukan callback yang didukung.' });
    }

    const configuredChatId = process.env.TELEGRAM_CHAT_ID;
    if (!configuredChatId || String(chatId) !== configuredChatId) {
      return NextResponse.json({ error: 'Sumber callback tidak dikenali.' }, { status: 403 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Konfigurasi Telegram belum lengkap.' }, { status: 503 });
    }

    const match = /^(APPROVE|REJECT)_(KUL-\d{8}-[A-F0-9]{8})$/.exec(callbackData);
    if (!match) {
      await telegramCall(botToken, 'answerCallbackQuery', {
        callback_query_id: callbackId,
        text: 'Perintah tidak valid.',
        show_alert: true,
      });
      return NextResponse.json({ error: 'Format callback tidak valid.' }, { status: 400 });
    }

    const [, action, orderId] = match;
    const { data, error } = await getSupabaseAdmin().rpc('process_order_approval_secure', {
      p_order_id: orderId,
      p_action: action,
    });

    if (error) {
      await telegramCall(botToken, 'answerCallbackQuery', {
        callback_query_id: callbackId,
        text: 'Order sudah diproses atau stok tidak mencukupi.',
        show_alert: true,
      });
      return NextResponse.json({ error: 'Order tidak dapat diproses.' }, { status: 409 });
    }

    const message = responseMessage(data);
    await telegramCall(botToken, 'answerCallbackQuery', {
      callback_query_id: callbackId,
      text: message,
      show_alert: true,
    });
    await telegramCall(botToken, 'editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: `${callbackQuery.message?.text ?? `Order ${orderId}`}\n\nSTATUS FINAL: ${message}`,
      reply_markup: { inline_keyboard: [] },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Callback Telegram gagal:', error);
    return NextResponse.json({ error: 'Callback Telegram gagal diproses.' }, { status: 502 });
  }
}
