"use client";

import type { Order } from '@/hooks/useAdminData';

function getCustomerWhatsAppUrl(phone: string, orderNumber: string) {
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '62');
  if (!/^62\d{8,13}$/.test(normalized)) return null;

  const message = `Halo, terkait pesanan ${orderNumber} di KulkasKuliner. Ada informasi mengenai produk/pesanan Anda.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

type OrderCardProps = {
  order: Order;
  onUpdateStatus: (status: string) => void;
};

export default function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const whatsappUrl = getCustomerWhatsAppUrl(order.customer_phone, order.order_number);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md md:flex-row">
      <div className="border-b border-slate-200 bg-slate-50/80 p-4 sm:p-5 md:w-2/5 md:border-b-0 md:border-r">
        <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded block w-fit mb-3 tracking-wider">{order.order_number}</span>
        <h2 className="text-base font-bold text-gray-900 leading-tight">{order.customer_name}</h2>
        <p className="text-sm font-semibold text-gray-600 mt-1 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
          {order.customer_phone}
        </p>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Hubungi ${order.customer_name} via WhatsApp`}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <span aria-hidden="true">💬</span> Chat WhatsApp Pembeli
          </a>
        )}

        <div className="mt-4 break-words rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700 shadow-sm">
          <span className="block font-black text-[10px] text-gray-400 mb-1">ALAMAT PENGIRIMAN:</span>
          {order.shipping_address}
        </div>

        {order.notes && order.notes.trim() !== '' && (
          <div className="mt-2 text-xs text-yellow-800 bg-yellow-50 p-3 border border-yellow-200 rounded-lg shadow-sm">
            <span className="block font-black text-[10px] text-yellow-600 mb-1">CATATAN:</span>
            {order.notes}
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between p-4 sm:p-5 md:w-3/5">
        <div>
          <ul className="space-y-2 mb-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <li key={idx} className="flex flex-col gap-1 border-b border-gray-100 pb-2 text-sm last:border-0 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                  <span className="font-medium leading-5 text-gray-800 min-[420px]:pr-4">
                    <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-1">{item.quantity}x</span>
                    {item.menu_name || item.name}{item.variant_name ? ` (${item.variant_name})` : ''}
                  </span>
                  <span className="whitespace-nowrap pl-7 font-bold text-gray-900 min-[420px]:pl-0">
                    Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                  </span>
                </li>
              ))
            ) : (
              order.order_items?.map((item) => (
                <li key={item.id} className="flex flex-col gap-1 border-b border-gray-100 pb-2 text-sm last:border-0 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                  <span className="font-medium leading-5 text-gray-800 min-[420px]:pr-4">
                    <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-1">{item.quantity}x</span>
                    {item.products?.name}
                  </span>
                  <span className="whitespace-nowrap pl-7 font-bold text-gray-900 min-[420px]:pl-0">
                    Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}
                  </span>
                </li>
              ))
            )}
          </ul>
          <div className="flex items-end justify-between gap-3 border-t border-dashed border-gray-300 pt-3">
            <span className="text-xs font-bold tracking-wide text-gray-500 sm:text-sm">TOTAL TAGIHAN</span>
            <span className="whitespace-nowrap text-lg font-black text-blue-700 sm:text-xl">Rp {order.total_amount.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className={`px-2.5 py-1.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm ${order.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : order.status === 'canceled' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
            {order.status}
          </span>
          <div className="grid w-full grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:flex sm:w-auto">
            {order.status === 'unpaid' && (
              <button onClick={() => onUpdateStatus('paid')} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">Terima Pembayaran &amp; Kurangi Stok</button>
            )}
            {order.status === 'unpaid' && (
              <button onClick={() => onUpdateStatus('canceled')} className="min-h-11 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 shadow-sm transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400">Tolak Pesanan</button>
            )}
            {order.status === 'paid' && (
              <button onClick={() => onUpdateStatus('unpaid')} className="min-h-11 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-700 shadow-sm transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400">↩ Batalkan Verifikasi</button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
