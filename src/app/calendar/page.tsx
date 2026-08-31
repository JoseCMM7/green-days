import type { Metadata } from "next";
import { EmotionalCalendar } from "@/components/calendar/emotional-calendar";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { getCalendarMonth } from "@/features/calendar/service";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Calendario emocional — Green Days",
};

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requireUser();
  const initialData = await getCalendarMonth(user);

  return (
    <FeaturePageShell
      eyebrow="Tu historia, día a día"
      title="Calendario emocional"
      description="Recorre tus días por fecha, emoción o color. No buscamos medir tu felicidad, sino ayudarte a reencontrar lo que viviste."
    >
      <EmotionalCalendar initialData={initialData} />
    </FeaturePageShell>
  );
}
