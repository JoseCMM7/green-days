import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Empieza tu colección"
      title="Un libro para tus días."
      description="Guarda lo pequeño, lo extraño y lo bonito. Todo será privado por defecto."
    >
      <AuthForm mode="sign-up" />
    </AuthShell>
  );
}
