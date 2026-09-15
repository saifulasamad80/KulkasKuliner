import { createClient } from '@supabase/supabase-js';

// Ekstraksi Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validasi Brutal: Hentikan aplikasi jika kredensial hilang (Mencegah Silent Error)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "FATAL ERROR: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi di .env.local"
  );
}

// Inisiasi Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);