import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export default function AuthErrorPage() {
  return (
    <AuthShell
      eyebrow="El enlace no funcionó"
      title="Intentémoslo otra vez."
      description="El enlace pudo caducar o ya fue utilizado. Puedes volver a iniciar sesión."
    >
      <Link
        href="/auth/login"
        className="mt-8 block rounded-full bg-[var(--yellow)] px-6 py-3.5 text-center font-bold text-[var(--brown-dark)]"
      >
        Volver a iniciar sesión
      </Link>
    </AuthShell>
  );
}
