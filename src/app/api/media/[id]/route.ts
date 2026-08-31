import { deleteJournalMedia, downloadJournalMedia } from "@/features/media/service";
import { requireApiUser } from "@/lib/auth/current-user";

const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const result = await downloadJournalMedia(user.id, id);
    if (!result) return Response.json({ error: "Archivo no encontrado." }, { status: 404, headers: privateHeaders });
    return new Response(await result.data.arrayBuffer(), {
      headers: { ...privateHeaders, "Content-Type": result.asset.mimeType, "Content-Length": String(result.asset.byteSize) },
    });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500;
    return Response.json({ error: status === 401 ? "Inicia sesión." : "No pudimos abrir el archivo." }, { status, headers: privateHeaders });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await deleteJournalMedia(user.id, id);
    return new Response(null, { status: 204, headers: privateHeaders });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500;
    return Response.json({ error: status === 401 ? "Inicia sesión." : "No pudimos eliminar el archivo." }, { status, headers: privateHeaders });
  }
}
