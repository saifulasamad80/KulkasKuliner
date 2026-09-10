import { NextResponse } from 'next/server';
import { hasAdminSession, isSameOrigin } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const allowedStatuses = new Set(['paid', 'canceled', 'completed']);

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/admin/orders/[id]'>
) {
  if (!(await hasAdminSession()) || !isSameOrigin(request)) {
    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const status = typeof body?.status === 'string' ? body.status : '';

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ error: 'Status pesanan tidak valid.' }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    let resultMessage: unknown = null;

    if (status === 'paid' || status === 'canceled') {
      const { data, error } = await admin.rpc('process_order_approval_secure', {
        p_order_id: id,
        p_action: status === 'paid' ? 'APPROVE' : 'REJECT',
      });
      if (error) throw error;
      resultMessage = data;
    } else {
      const { error } = await admin.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      resultMessage = { status };
    }

    return NextResponse.json({ result: resultMessage });
  } catch (error) {
    console.error('Status pesanan gagal diperbarui:', error);
    return NextResponse.json(
      { error: 'Status pesanan gagal diperbarui. Stok mungkin tidak mencukupi.' },
      { status: 409 }
    );
  }
}
