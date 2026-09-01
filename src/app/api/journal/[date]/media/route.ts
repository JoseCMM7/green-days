import { z } from "zod";
import { getOrCreateEntry } from "@/features/journal/service";
import { isEntryDate } from "@/features/journal/date";
import { uploadJournalMedia } from "@/features/media/service";
import { requireApiUser } from "@/lib/auth/current-user";

function privateJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { ...init?.headers, "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params;
    if (!isEntryDate(date)) return privateJson({ error: "Fecha inválida." }, { status: 400 });
    const user = await requireApiUser();
    const entry = await getOrCreateEntry(user, date);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return privateJson({ error: "Selecciona un archivo." }, { status: 400 });
    const dimensions = z.object({
      width: z.coerce.number().int().positive().max(20_000).optional(),
      height: z.coerce.number().int().positive().max(20_000).optional(),
    }).refine((value) => Boolean(value.width) === Boolean(value.height)).safeParse({
      width: formData.get("width") || undefined,
      height: formData.get("height") || undefined,
    });
    if (!dimensions.success) return privateJson({ error: "Las dimensiones de la fotografía no son válidas." }, { status: 400 });
    return privateJson(await uploadJournalMedia(user, entry.entryId, file, dimensions.data));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return privateJson({ error: "Tu sesión terminó." }, { status: 401 });
    return privateJson({ error: error instanceof Error ? error.message : "No pudimos subir el archivo." }, { status: 400 });
  }
}
