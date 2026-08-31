"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureProfile } from "@/lib/auth/profiles";
import { createClient } from "@/lib/supabase/server";
import { SupabaseEnvironmentError } from "@/lib/supabase/environment";

const emailSchema = z.email("Escribe un correo válido.").trim();
const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña es demasiado larga.");

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signUpSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, "Escribe el nombre que quieres ver.").max(60),
});

export type AuthState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function configurationErrorState(error: unknown): AuthState | null {
  if (!(error instanceof SupabaseEnvironmentError)) return null;

  return {
    status: "error",
    message:
      "Falta terminar la conexión con Supabase. Agrega la clave publicable en .env.local y reinicia el servidor.",
  };
}

export async function login(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let result;
  try {
    const supabase = await createClient();
    result = await supabase.auth.signInWithPassword(parsed.data);
  } catch (error) {
    const configurationState = configurationErrorState(error);
    if (configurationState) return configurationState;
    throw error;
  }

  const { data, error } = result;

  if (error || !data.user) {
    return {
      status: "error",
      message: "No pudimos iniciar sesión. Revisa el correo y la contraseña.",
    };
  }

  await ensureProfile({
    id: data.user.id,
    email: data.user.email,
    displayName: data.user.user_metadata.display_name,
  });

  redirect("/");
}

export async function signUp(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  let result;
  try {
    const supabase = await createClient();
    result = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: `${origin}/auth/confirm`,
      },
    });
  } catch (error) {
    const configurationState = configurationErrorState(error);
    if (configurationState) return configurationState;
    throw error;
  }

  const { data, error } = result;

  if (error || !data.user) {
    return {
      status: "error",
      message: error?.message.includes("already registered")
        ? "Ese correo ya tiene una cuenta. Prueba iniciar sesión."
        : "No pudimos crear la cuenta. Inténtalo nuevamente.",
    };
  }

  await ensureProfile({
    id: data.user.id,
    email: data.user.email,
    displayName: parsed.data.displayName,
  });

  if (data.session) {
    redirect("/");
  }

  return {
    status: "success",
    message: "Cuenta creada. Revisa tu correo para confirmar y abrir tu diario.",
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
