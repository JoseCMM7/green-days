import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/auth/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/";
  const supabase = await createClient();

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { data: { user: null }, error: new Error("Enlace incompleto") };

  if (result.error || !result.data.user) {
    return NextResponse.redirect(new URL("/auth/error", url.origin));
  }

  await ensureProfile({
    id: result.data.user.id,
    email: result.data.user.email,
    displayName: result.data.user.user_metadata.display_name,
  });

  return NextResponse.redirect(new URL(next, url.origin));
}
