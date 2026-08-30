"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  login,
  signUp,
  type AuthState,
} from "@/app/auth/actions";

type AuthFormProps = {
  mode: "login" | "sign-up";
};

const initialAuthState: AuthState = { status: "idle" };

function FieldError({ state, name }: { state: AuthState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <p className="mt-1 text-xs text-[#a13f2d]">{message}</p> : null;
}

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "login" ? login : signUp;
  const [state, formAction, pending] = useActionState(action, initialAuthState);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {!isLogin && (
        <div>
          <label htmlFor="displayName" className="text-sm font-semibold text-[var(--brown-dark)]">
            Cómo quieres que te llamemos
          </label>
          <input
            id="displayName"
            name="displayName"
            autoComplete="name"
            required
            className="mt-2 w-full rounded-2xl border border-[var(--brown-light)] bg-[#fff6df] px-4 py-3.5 outline-none transition focus:border-[var(--ochre)] focus:ring-4 focus:ring-[var(--yellow-soft)]/50"
            placeholder="Tu nombre"
          />
          <FieldError state={state} name="displayName" />
        </div>
      )}

      <div>
        <label htmlFor="email" className="text-sm font-semibold text-[var(--brown-dark)]">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full rounded-2xl border border-[var(--brown-light)] bg-[#fff6df] px-4 py-3.5 outline-none transition focus:border-[var(--ochre)] focus:ring-4 focus:ring-[var(--yellow-soft)]/50"
          placeholder="tu@correo.com"
        />
        <FieldError state={state} name="email" />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-semibold text-[var(--brown-dark)]">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={8}
          required
          className="mt-2 w-full rounded-2xl border border-[var(--brown-light)] bg-[#fff6df] px-4 py-3.5 outline-none transition focus:border-[var(--ochre)] focus:ring-4 focus:ring-[var(--yellow-soft)]/50"
          placeholder="Mínimo 8 caracteres"
        />
        <FieldError state={state} name="password" />
      </div>

      {state.message && (
        <p
          aria-live="polite"
          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
            state.status === "success"
              ? "bg-[#dce5c2] text-[#435138]"
              : "bg-[#f5d5c5] text-[#853825]"
          }`}
        >
          {state.message}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-full bg-[var(--yellow)] px-6 py-3.5 font-bold text-[var(--brown-dark)] shadow-[0_12px_28px_rgba(181,117,25,0.18)] transition hover:-translate-y-0.5 hover:bg-[#f5cd61] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Un momento…" : isLogin ? "Entrar a mi diario" : "Crear mi diario"}
      </button>

      <p className="text-center text-sm text-[var(--muted)]">
        {isLogin ? "¿Es tu primera vez?" : "¿Ya tienes una cuenta?"}{" "}
        <Link
          href={isLogin ? "/auth/sign-up" : "/auth/login"}
          className="font-bold text-[var(--brown)] underline decoration-[var(--yellow)] underline-offset-4"
        >
          {isLogin ? "Crear una cuenta" : "Iniciar sesión"}
        </Link>
      </p>
    </form>
  );
}
