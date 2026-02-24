import { createBrowserClient } from "@supabase/ssr";

function getEnv(key: string, windowKey: string): string {
  // Try process.env first (works with webpack, sometimes with Turbopack)
  const fromEnv = process.env[key];
  if (fromEnv) return fromEnv;
  // Fallback: value injected via <script> tag in layout.tsx (Server Component)
  if (typeof window !== "undefined") {
    return (window as any)[windowKey] ?? "";
  }
  return "";
}

export function createClient() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL", "__SUPABASE_URL__");
  const supabaseAnonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "__SUPABASE_ANON_KEY__");

  // Only create client if we have valid credentials
  if (!supabaseUrl || !supabaseAnonKey) {
    return null as any;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
