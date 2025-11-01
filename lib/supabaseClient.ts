import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// console.log('serviceKey', serviceKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getUserSupabaseClient(token: string) {
  if (!token) throw new Error("Missing token for Supabase client");

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

// /**
//  * Server-side Supabase client (Service Role key)
//  * Used only for background jobs, AI processing, and cron.
//  */
// export const supabaseServer = createClient(
//   supabaseUrl,
//   serviceKey,
//   { auth: { persistSession: false } }
// );