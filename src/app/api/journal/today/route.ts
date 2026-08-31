import { NextResponse } from "next/server";
import { z } from "zod";
import { bookSchema } from "@/db/mongodb/schemas";
import { moodSlugs } from "@/features/calendar/moods";
import { EntryConflictError, getOrCreateTodayEntry, saveTodayEntry } from "@/features/journal/service";
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

export async function GET() {
  try {
    const user = await requireApiUser();
    return privateJson(await getOrCreateTodayEntry(user));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return privateJson({ error: "Inicia sesión para abrir tu libro." }, { status: 401 });
    }

    return privateJson({ error: "No pudimos abrir el libro." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireApiUser();
    const parsed = saveSchema.safeParse(await request.json());

    if (!parsed.success) {
      return privateJson({ error: "El contenido del libro no es válido." }, { status: 400 });
    }

    return privateJson(await saveTodayEntry({ user, ...parsed.data }));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return privateJson({ error: "Tu sesión terminó. Vuelve a entrar." }, { status: 401 });
    }

    if (error instanceof EntryConflictError) {
      return privateJson({ error: error.message }, { status: 409 });
    }

    return privateJson({ error: "No pudimos guardar el libro." }, { status: 500 });
  }
}
