import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { order_id, customer_name, total_amount, items_detail } = await request.json();
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const message = `🚨 *PESANAN BARU MASUK!* 🚨\n\n*Order ID:* ${order_id}\n*Nama:* ${customer_name}\n*Total:* Rp ${total_amount.toLocaleString('id-ID')}\n\n*Detail Keranjang:*\n${items_detail}\n\n⚠️ *TINDAKAN DIBUTUHKAN:*\nCek WA lu sekarang. Jika bukti transfer valid, klik APPROVE untuk meresmikan pesanan dan potong stok.`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "✅ APPROVE (Potong Stok)", callback_data: `APPROVE_${order_id}` },
          { text: "❌ REJECT (Batalkan)", callback_data: `REJECT_${order_id}` }
        ]
      ]
    };

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      })
    });

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}