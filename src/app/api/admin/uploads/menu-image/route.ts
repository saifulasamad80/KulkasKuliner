import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { hasAdminSession, isSameOrigin } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const MAX_SIZE = 5 * 1024 * 1024;

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await hasAdminSession()) || !isSameOrigin(request)) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_SIZE || !allowedTypes.has(file.type)) {
      return NextResponse.json({ error: 'Foto harus JPG, PNG, atau WebP maksimal 5 MB.' }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const signature = Array.from(bytes.slice(0, 24)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const validSignature = file.type === 'image/jpeg' ? signature.startsWith('ffd8ff') : file.type === 'image/png' ? signature.startsWith('89504e470d0a1a0a') : signature.slice(0, 8) === '52494646' && signature.slice(16, 24) === '57454250';
    if (!validSignature) return NextResponse.json({ error: 'Isi file bukan gambar yang valid.' }, { status: 400 });
    const extension = allowedTypes.get(file.type);
    if (!extension) return NextResponse.json({ error: 'Format foto tidak didukung.' }, { status: 400 });
    const path = `menus/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
    const admin = getSupabaseAdmin();
    const { error: uploadError } = await admin.storage.from('menu-images').upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data } = admin.storage.from('menu-images').getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error('Upload foto menu gagal:', error);
    return NextResponse.json({ error: 'Foto menu gagal diunggah.' }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession()) || !isSameOrigin(request)) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  if (typeof body?.url !== 'string') return NextResponse.json({ error: 'URL foto tidak valid.' }, { status: 400 });

  try {
    const suppliedUrl = new URL(body.url);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || suppliedUrl.origin !== new URL(supabaseUrl).origin) {
      return NextResponse.json({ error: 'URL foto bukan dari Storage toko.' }, { status: 400 });
    }

    const marker = '/storage/v1/object/public/menu-images/';
    if (!suppliedUrl.pathname.startsWith(marker) || suppliedUrl.search || suppliedUrl.hash) {
      return NextResponse.json({ error: 'URL foto bukan dari bucket menu.' }, { status: 400 });
    }

    const path = decodeURIComponent(suppliedUrl.pathname.slice(marker.length));
    if (!/^menus\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(path)) {
      return NextResponse.json({ error: 'Path foto tidak valid.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const [productReference, menuReference] = await Promise.all([
      admin.from('products').select('id').eq('image_url', body.url).limit(1),
      admin.from('menus').select('id').eq('image_url', body.url).limit(1),
    ]);
    if (productReference.error || menuReference.error) {
      console.error('Referensi foto menu gagal diperiksa:', productReference.error || menuReference.error);
      return NextResponse.json({ error: 'Referensi foto gagal diperiksa.' }, { status: 502 });
    }
    if ((productReference.data?.length ?? 0) > 0 || (menuReference.data?.length ?? 0) > 0) {
      return NextResponse.json({ deleted: false, inUse: true }, { status: 409 });
    }

    const { error } = await admin.storage.from('menu-images').remove([path]);
    if (error) {
      console.error('Hapus foto menu gagal:', error);
      return NextResponse.json({ error: 'Foto menu gagal dihapus.' }, { status: 502 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('URL foto menu gagal diproses:', error);
    return NextResponse.json({ error: 'URL foto tidak valid.' }, { status: 400 });
  }
}