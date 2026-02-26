import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const error = requestUrl.searchParams.get("error");
  const error_code = requestUrl.searchParams.get("error_code");
  const error_description = requestUrl.searchParams.get("error_description");

  // Stabile Production-URL für alle Weiterleitungen verwenden
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;

  // Fehler direkt von Supabase weitergeben
  if (error) {
    const redirectUrl = new URL("/auth/confirmed", baseUrl);
    redirectUrl.searchParams.set("error", error);
    if (error_code) redirectUrl.searchParams.set("error_code", error_code);
    if (error_description) redirectUrl.searchParams.set("error_description", error_description);
    return NextResponse.redirect(redirectUrl);
  }

  if (code || (token_hash && type)) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
            } catch {}
          },
        },
      }
    );

    if (code) {
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) {
        const redirectUrl = new URL("/auth/confirmed", baseUrl);
        redirectUrl.searchParams.set("error", "session_error");
        redirectUrl.searchParams.set("error_description", sessionError.message);
        return NextResponse.redirect(redirectUrl);
      }
    } else if (token_hash && type) {
      const { error: otpError } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (otpError) {
        const redirectUrl = new URL("/auth/confirmed", baseUrl);
        redirectUrl.searchParams.set("error", "otp_error");
        redirectUrl.searchParams.set("error_description", otpError.message);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return NextResponse.redirect(new URL("/auth/confirmed", baseUrl));
}