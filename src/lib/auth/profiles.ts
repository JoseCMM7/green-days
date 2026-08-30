import "server-only";

import { eq } from "drizzle-orm";
import { getPostgresDatabase } from "@/db/postgres/client";
import { profiles } from "@/db/postgres/schema";

export function fallbackDisplayName(email: string | null | undefined) {
  const localPart = email?.split("@")[0]?.trim();
  return localPart || "Mi diario";
}

export async function ensureProfile(input: {
  id: string;
  email?: string | null;
  displayName?: string | null;
}) {
  const database = getPostgresDatabase();

  await database
    .insert(profiles)
    .values({
      id: input.id,
      displayName: input.displayName?.trim() || fallbackDisplayName(input.email),
    })
    .onConflictDoNothing();

  const [profile] = await database
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      timeZone: profiles.timeZone,
    })
    .from(profiles)
    .where(eq(profiles.id, input.id))
    .limit(1);

  if (!profile) {
    throw new Error("No fue posible preparar el perfil.");
  }

  return profile;
}
