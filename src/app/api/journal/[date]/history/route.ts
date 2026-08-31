import { z } from "zod";
import { isEntryDate } from "@/features/journal/date";
import { listEntryHistory, restoreEntryRevision } from "@/features/journal/service";
import { requireApiUser } from "@/lib/auth/current-user";

function privateJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { ...init?.headers, "Cache-Control": "private, no-store" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params;
    if (!isEntryDate(date)) return privateJson({ error: "Fecha inválida." }, { status: 400 });
    const user = await requireApiUser();
    return privateJson({ versions: await listEntryHistory(user, date) });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500;
    return privateJson({ error: status === 401 ? "Inicia sesión." : "No pudimos cargar el historial." }, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params;
    if (!isEntryDate(date)) return privateJson({ error: "Fecha inválida." }, { status: 400 });
    const parsed = z.object({ revision: z.int().positive() }).safeParse(await request.json());
    if (!parsed.success) return privateJson({ error: "Revisión inválida." }, { status: 400 });
    const user = await requireApiUser();
    return privateJson(await restoreEntryRevision(user, date, parsed.data.revision));
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500;
    return privateJson({ error: status === 401 ? "Inicia sesión." : error instanceof Error ? error.message : "No pudimos restaurar." }, { status });
  }
}
