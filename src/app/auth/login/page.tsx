import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Tu espacio privado"
      title="Qué gusto verte de nuevo."
      description="Tus páginas te esperan exactamente como las dejaste."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
