"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { albumInputSchema } from "@/features/albums/model";
import { addEntryToAlbum, createAlbum, deleteAlbum, removeEntryFromAlbum, updateAlbumPresentation } from "@/features/albums/service";
import { requireUser } from "@/lib/auth/current-user";

export type AlbumActionState = { status: "idle" | "success" | "error"; message?: string };

export async function createAlbumAction(_state: AlbumActionState, formData: FormData): Promise<AlbumActionState> {
  const user = await requireUser();
  const parsed = albumInputSchema.safeParse({
    title: formData.get("title"), description: formData.get("description") || undefined,
    layout: formData.get("layout"), accentColor: formData.get("accentColor"),
    fromDate: formData.get("fromDate"), toDate: formData.get("toDate"),
    emotionSlug: formData.get("emotionSlug") || undefined,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa el álbum." };
  try {
    await createAlbum(user, parsed.data);
    revalidatePath("/albums");
    return { status: "success", message: "Tu álbum ya puede empezar a crecer." };
  } catch {
    return { status: "error", message: "No pudimos crear el álbum. Inténtalo nuevamente." };
  }
}

export async function addAlbumEntryAction(albumId: string, formData: FormData) {
  const user = await requireUser();
  const entryId = String(formData.get("entryId") ?? "");
  await addEntryToAlbum(user.id, albumId, entryId);
  revalidatePath(`/albums/${albumId}`);
  revalidatePath("/albums");
}

export async function removeAlbumEntryAction(albumId: string, entryId: string) {
  const user = await requireUser();
  await removeEntryFromAlbum(user.id, albumId, entryId);
  revalidatePath(`/albums/${albumId}`);
  revalidatePath("/albums");
}

export async function updateAlbumPresentationAction(albumId: string, formData: FormData) {
  const user = await requireUser();
  const layout = formData.get("layout");
  const color = String(formData.get("accentColor") ?? "");
  if (!(["scrapbook", "film", "storybook"] as const).includes(layout as "scrapbook" | "film" | "storybook") || !/^#[0-9a-f]{6}$/i.test(color)) {
    throw new Error("Presentación inválida.");
  }
  await updateAlbumPresentation(user.id, albumId, layout as "scrapbook" | "film" | "storybook", color);
  revalidatePath(`/albums/${albumId}`);
  revalidatePath("/albums");
}

export async function deleteAlbumAction(albumId: string) {
  const user = await requireUser();
  await deleteAlbum(user.id, albumId);
  revalidatePath("/albums");
  redirect("/albums");
}
