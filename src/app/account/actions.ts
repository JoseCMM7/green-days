"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getPostgresDatabase } from "@/db/postgres/client";
import { outboxEvents } from "@/db/postgres/schema";
import { deleteUserMongoData } from "@/features/account/delete-data";
import { isDeletionConfirmed } from "@/features/account/confirmation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = {
  status: "idle" | "error";
  message?: string;
};

export async function deleteAccount(
  _previousState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Tu sesión terminó. Vuelve a entrar." };

  if (!isDeletionConfirmed(formData.get("confirmation"))) {
    return { status: "error", message: "Escribe ELIMINAR exactamente para confirmar." };
  }

  const database = getPostgresDatabase();
  const [event] = await database
    .insert(outboxEvents)
    .values({
      aggregateType: "account",
      aggregateId: user.id,
      eventType: "account.deletion_requested",
      payload: { userId: user.id },
    })
    .returning({ id: outboxEvents.id });

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_own_account");

  if (error) {
    await database
      .update(outboxEvents)
      .set({ status: "failed", attempts: 1, lastError: error.message.slice(0, 500) })
      .where(eq(outboxEvents.id, event.id));
    return {
      status: "error",
      message: "No pudimos eliminar la cuenta. Tus datos siguen intactos; inténtalo nuevamente.",
    };
  }

  try {
    await deleteUserMongoData(user.id);
    await database
      .update(outboxEvents)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(outboxEvents.id, event.id));
  } catch (cleanupError) {
    await database
      .update(outboxEvents)
      .set({
        status: "pending",
        attempts: 1,
        lastError: cleanupError instanceof Error
          ? cleanupError.message.slice(0, 500)
          : "Error desconocido al limpiar MongoDB",
      })
      .where(eq(outboxEvents.id, event.id));
  }

  await supabase.auth.signOut().catch(() => undefined);
  redirect("/auth/login?deleted=1");
}

