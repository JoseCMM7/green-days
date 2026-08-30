import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (error || !claims?.sub) {
      return null;
    }

    const metadata = claims.user_metadata as { display_name?: string } | undefined;

    return {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      displayName: metadata?.display_name ?? null,
    };
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

export async function requireApiUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}
