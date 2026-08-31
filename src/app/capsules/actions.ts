"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { capsuleInputSchema, isFutureUnlockDate } from "@/features/capsules/model";
import { createCapsule, deleteCapsule, openCapsule } from "@/features/capsules/service";

export type CapsuleActionState = { status: "idle" | "success" | "error"; message?: string };

export async function createCapsuleAction(
  _state: CapsuleActionState,
  formData: FormData,
): Promise<CapsuleActionState> {
  const user = await requireUser();
  const parsed = capsuleInputSchema.safeParse({
    title: formData.get("title"),
    message: formData.get("message"),
    unlockDate: formData.get("unlockDate"),
    paperColor: formData.get("paperColor"),
    revealStyle: formData.get("revealStyle"),
    sealStickerId: formData.get("sealStickerId") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }
  if (!isFutureUnlockDate(parsed.data.unlockDate)) {
    return { status: "error", message: "Elige una fecha futura para abrirla." };
  }
  try {
    await createCapsule(user, parsed.data);
    revalidatePath("/capsules");
    return { status: "success", message: "Tu cápsula quedó sellada." };
  } catch {
    return { status: "error", message: "No pudimos sellarla. Tus datos no quedaron a medias." };
  }
}

export async function openCapsuleAction(capsuleId: string) {
  const user = await requireUser();
  await openCapsule(user.id, capsuleId);
  revalidatePath(`/capsules/${capsuleId}`);
  revalidatePath("/capsules");
}

export async function deleteCapsuleAction(capsuleId: string) {
  const user = await requireUser();
  await deleteCapsule(user.id, capsuleId);
  revalidatePath("/capsules");
  redirect("/capsules");
}
