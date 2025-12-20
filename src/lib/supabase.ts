import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// クライアント用（公開）
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// サーバー用（Service Role - 管理画面・API用）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
