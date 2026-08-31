export class SupabaseEnvironmentError extends Error {
  constructor() {
    super("La conexión pública con Supabase todavía no está configurada.");
    this.name = "SupabaseEnvironmentError";
  }
}

export function getSupabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new SupabaseEnvironmentError();
  }

  return { url, publishableKey };
}
