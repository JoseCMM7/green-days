import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="auth-room grid min-h-screen place-items-center px-5 py-12">
      <div className="auth-paper relative w-full max-w-md p-6 sm:p-9">
        <span className="auth-paper-tape" aria-hidden="true" />
        <BrandMark />
        <p className="mt-9 text-xs font-bold uppercase tracking-[0.18em] text-[var(--ochre)]">
          {eyebrow}
        </p>
        <h1 className="font-display mt-2 text-4xl leading-tight font-semibold tracking-[-0.04em]">
          {title}
        </h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{description}</p>
        {children}
        <p className="mt-6 text-center text-xs text-[var(--muted)]"><Link href="/showcase" className="font-bold underline decoration-[var(--yellow)] underline-offset-4">Conocer el proyecto antes de entrar</Link></p>
      </div>
    </main>
  );
}
