import { NextResponse } from "next/server";
import { z } from "zod";
import { bookSchema } from "@/db/mongodb/schemas";
import { moodSlugs } from "@/features/calendar/moods";
import { EntryConflictError, getOrCreateEntry, saveEntry } from "@/features/journal/service";
import { isEntryDate } from "@/features/journal/date";
import { requireApiUser } from "@/lib/auth/current-user";

const saveSchema = z.object({
  expectedRevision: z.int().positive(),
  book: bookSchema,
  primaryMoodSlug: z.enum(moodSlugs).nullable(),
});

function privateJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params;
    if (!isEntryDate(date)) return privateJson({ error: "Fecha inválida." }, { status: 400 });
    const user = await requireApiUser();
    return privateJson(await getOrCreateEntry(user, date));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return privateJson({ error: "Inicia sesión para abrir tu libro." }, { status: 401 });
    return privateJson({ error: "No pudimos abrir este libro." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params;
    if (!isEntryDate(date)) return privateJson({ error: "Fecha inválida." }, { status: 400 });
    const user = await requireApiUser();
    const parsed = saveSchema.safeParse(await request.json());
    if (!parsed.success) return privateJson({ error: "El contenido del libro no es válido." }, { status: 400 });
    return privateJson(await saveEntry({ user, entryDate: date, ...parsed.data }));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return privateJson({ error: "Tu sesión terminó. Vuelve a entrar." }, { status: 401 });
    if (error instanceof EntryConflictError) return privateJson({ error: error.message }, { status: 409 });
    return privateJson({ error: "No pudimos guardar el libro." }, { status: 500 });
  }
}
