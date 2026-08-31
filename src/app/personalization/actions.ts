"use server";

import { revalidatePath } from "next/cache";
import { personalizationInputSchema } from "@/features/personalization/model";
import { savePersonalization } from "@/features/personalization/service";
import { requireUser } from "@/lib/auth/current-user";

export type PersonalizationState = { status: "idle" | "success" | "error"; message?: string };

export async function savePersonalizationAction(_state: PersonalizationState, formData: FormData): Promise<PersonalizationState> {
  const user = await requireUser();
  const parsed = personalizationInputSchema.safeParse({
    mode: formData.get("mode"),
    reducedMotion: formData.get("reducedMotion") === "on",
    tokens: {
      cream: formData.get("cream"), paper: formData.get("paper"), ink: formData.get("ink"), muted: formData.get("muted"),
      line: formData.get("line"), yellow: formData.get("yellow"), yellowSoft: formData.get("yellowSoft"), ochre: formData.get("ochre"),
      brownLight: formData.get("brownLight"), brown: formData.get("brown"), brownDark: formData.get("brownDark"),
      sage: formData.get("sage"), sageSoft: formData.get("sageSoft"), sageDark: formData.get("sageDark"), displayFont: formData.get("displayFont"),
    },
  });
  if (!parsed.success) return { status: "error", message: "Hay un color o una opción que no es válida." };
  await savePersonalization(user.id, parsed.data);
  revalidatePath("/", "layout");
  return { status: "success", message: "Tu espacio ya tiene este estilo." };
}
