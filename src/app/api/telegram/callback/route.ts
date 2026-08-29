import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.callback_query) {
      return NextResponse.json({ message: "Abaikan, bukan perintah dari tombol." });
    }

    const callbackQuery = body.callback_query;
    const callbackData = callbackQuery.data; // Contoh: "APPROVE_KUL-123"
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const callbackId = callbackQuery.id;

    // Memecah perintah dan Order ID
    const [action, orderId] = callbackData.split('_');

    // 1. Tembak RPC Supabase untuk memproses persetujuan di Database
    const { data: resultMessage, error } = await supabase.rpc('process_telegram_approval', {
      p_order_id: orderId,
      p_action: action
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // 2. Matikan loading spinner di tombol Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        callback_query_id: callbackId, 
        text: resultMessage || 'Sistem error saat memproses',
        show_alert: true 
      })
    });

    // 3. Edit pesan Telegram agar tombolnya musnah (mencegah klik ganda)
    const originalText = callbackQuery.message.text;
    const finalMessage = `${originalText}\n\n====================\nSTATUS FINAL: ${resultMessage}`;
    
    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: finalMessage
      })
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}