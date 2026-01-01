import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client with service role key (bypasses RLS)
 * Use this for server-to-server operations like webhook callbacks
 * where there is no authenticated user session.
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. " +
      "This is required for webhook callbacks."
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
      "This is required for webhook callbacks. " +
      "Get it from your Supabase dashboard: Settings > API > service_role key"
    );
  }

  // Verify the key format (service role keys start with 'eyJ' and are longer)
  if (supabaseServiceRoleKey.length < 100) {
    console.warn(
      "[ServiceRole] Warning: Service role key seems too short. " +
      "Service role keys are typically 200+ characters long."
    );
  }

  const client = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Log for debugging (remove in production or make it conditional)
  if (process.env.NODE_ENV === "development") {
    console.log("[ServiceRole] Client created with service role key");
    console.log("[ServiceRole] URL:", supabaseUrl);
    console.log("[ServiceRole] Key length:", supabaseServiceRoleKey.length);
    console.log("[ServiceRole] Key preview:", supabaseServiceRoleKey.substring(0, 20) + "...");
  }

  return client;
}

