import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default async function LoginPage({ searchParams }: PageProps<"/auth/login">) {
  const { deleted } = await searchParams;

  return (
    <AuthShell
      eyebrow="Tu espacio privado"
      title="Qué gusto verte de nuevo."
      description="Tus páginas te esperan exactamente como las dejaste."
    >
      {deleted === "1" && (
        <p className="rounded-2xl bg-[#dce5c2] px-4 py-3 text-sm leading-6 text-[#435138]" role="status">
          Tu cuenta y tus recuerdos fueron eliminados.
        </p>
      )}
      <AuthForm mode="login" />
    </AuthShell>
  );
}
