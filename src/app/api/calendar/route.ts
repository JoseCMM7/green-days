import { NextResponse } from "next/server";
import { getCalendarMonth } from "@/features/calendar/service";
import { parseMonth } from "@/features/calendar/month";
import { requireApiUser } from "@/lib/auth/current-user";

function privateJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const requestedMonth = new URL(request.url).searchParams.get("month");

    if (requestedMonth && !parseMonth(requestedMonth)) {
      return privateJson({ error: "El mes solicitado no es válido." }, { status: 400 });
    }

    return privateJson(await getCalendarMonth(user, requestedMonth));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return privateJson({ error: "Inicia sesión para ver tu calendario." }, { status: 401 });
    }

    return privateJson({ error: "No pudimos abrir tu calendario." }, { status: 500 });
  }
}

