import type { Metadata } from "next";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { PersonalizationStudio } from "@/components/personalization/personalization-studio";
import { getPersonalization } from "@/features/personalization/service";
import { requireUser } from "@/lib/auth/current-user";
import { ensureProfile } from "@/lib/auth/profiles";

export const metadata: Metadata = { title: "Personalización — Green Days" };
export const dynamic = "force-dynamic";

export default async function PersonalizationPage() {
  const user = await requireUser();
  await ensureProfile({ id: user.id, email: user.email, displayName: user.displayName });
  const personalization = await getPersonalization(user.id);
  return <FeaturePageShell eyebrow="Tu espacio, tus reglas" title="Personalización profunda" description="Elige la atmósfera de Green Days y define cómo se sentirán tus próximas páginas."><PersonalizationStudio initialMode={personalization.mode} initialTokens={personalization.tokens} initialReducedMotion={personalization.reducedMotion} /></FeaturePageShell>;
}
