import { buildUserExport } from "@/features/account/export-data";
import { exportFilename } from "@/features/account/export-format";
import { requireApiUser } from "@/lib/auth/current-user";

function privateError(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET() {
  try {
    const user = await requireApiUser();
    const data = await buildUserExport(user);

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${exportFilename()}"`,
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return privateError("Inicia sesión para exportar tus datos.", 401);
    }

    return privateError("No pudimos preparar la exportación.", 500);
  }
}
